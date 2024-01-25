const {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');
const session = require('../model/session');

// Establish AWS s3 connection
const client = new S3Client({
  credentials: {
    accessKeyId: 'AKIATSWAQXS2MMP2OFMP',
    secretAccessKey: '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',
  },
  region: 'eu-north-1',
});

const bucketname = process.env.S3_BUCKET_NAME;

const uploadAudio = async (filename, file, sessionId, io) => {
  // The minimum upload size for a single data file is 5mb
  const chunkSize = 5 * 1024 * 1024; // 5 MB
  const totalChunks = Math.floor(file.byteLength / chunkSize);

  if (totalChunks < 3) {
    try {
      const options = { new: true };

      const command = new PutObjectCommand({
        Bucket: bucketname,
        Key: filename,
        Body: file,
        ContentType: 'audio/mpeg',
        ACL: 'public-read',
      });

      const response = await client.send(command);

      if (response) {
        const updatedData = {
          sessionStatus: 'saved',
          uploadStatus: 100,
          audioUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`,
        };

        const savedResult = await session.findByIdAndUpdate(
          sessionId,
          updatedData,
          options
        );

        io.emit('fileSaved', {
          data: savedResult,
        });
      }

      return { status: true, audioId: filename };
    } catch (err) {
      console.error(err);
    }
  } else {
    let uploadId;

    const savedSession = await session.findById(sessionId);

    try {
      const multipartUpload = await client.send(
        new CreateMultipartUploadCommand({
          Bucket: bucketname,
          Key: filename,
        })
      );

      uploadId = multipartUpload.UploadId;

      const uploadPromises = [];

      // Upload each chuck part of file data
      for (let i = 0; i < totalChunks; i++) {
        const start = i * totalChunks;
        // calculation to ensure that if last chuck part isn't up to 5mb the total remaining chunk is uploaded as the last chunk
        const end =
          i === totalChunks - 1
            ? file.byteLength
            : Math.min((i + 1) * chunkSize, file.byteLength);

        // calculate percentage upload, excluded the first and final percentages
        if (i !== 0 && i === totalChunks - 1) {
          const percentage = (currentIteration / totalIterations) * 100;
          // overwrite percentage value from the cureent session
          io.emit('fileSaved', {
            data: { ...savedSession, uploadStatus: percentage },
          });
        }

        uploadPromises.push(
          client
            .send(
              new UploadPartCommand({
                Bucket: bucketname,
                Key: filename,
                UploadId: uploadId,
                Body: file.subarray(start, end),
                PartNumber: i + 1,
              })
            )
            .then((d) => {
              console.log('Part', i + 1, 'uploaded');
              return d;
            })
        );
      }

      const uploadResults = await Promise.all(uploadPromises);

      const uploadResponse = await client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucketname,
          Key: filename,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: uploadResults.map(({ ETag }, i) => ({
              ETag,
              PartNumber: i + 1,
            })),
          },
        })
      );

      // emit saved status for a session
      if (uploadResponse) {
        const updatedData = {
          sessionStatus: 'saved',
          uploadStatus: 100,
          audioUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`,
        };

        const savedResult = await session.findByIdAndUpdate(
          sessionId,
          updatedData,
          options
        );

        io.emit('fileSaved', {
          data: savedResult,
        });
      }
    } catch (err) {
      console.log(err);
      if (uploadId) {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: bucketname,
          Key: filename,
          UploadId: uploadId,
        });

        await client.send(abortCommand);
      }
    }
  }
};

module.exports = uploadAudio;
