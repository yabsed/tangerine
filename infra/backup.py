import os
import sys
from datetime import datetime, timezone

import boto3


def main():
    key = datetime.now(timezone.utc).strftime("backups/%Y-%m-%dT%H-%M-%SZ.sql.gz")
    s3_client = boto3.client("s3")
    s3_client.upload_fileobj(
        sys.stdin.buffer,
        os.environ["S3_BUCKET"],
        key,
        ExtraArgs={"ContentType": "application/gzip"},
    )
    print("Database backup uploaded.")


if __name__ == "__main__":
    main()
