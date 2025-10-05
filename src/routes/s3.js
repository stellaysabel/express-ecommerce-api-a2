const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const router = express.Router();

// Use your existing bucket name here
const BUCKET = 'n12540285-test';
const REGION = 'ap-southeast-2';

// Create an S3 client
const s3 = new S3Client({ region: REGION });

// POST /api/s3/presign-upload
router.post('/presign-upload', async (req, res) => {
  try {
    const { key, contentType } = req.body;
    if (!key || !contentType) {
      return res.status(400).json({ error: 'key and contentType required' });
    }

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    res.json({ url, key });
  } catch (err) {
    console.error('Upload presign error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/s3/presign-download?key=...
router.get('/presign-download', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({ error: 'key required' });
    }

    const cmd = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    res.json({ url });
  } catch (err) {
    console.error('Download presign error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
