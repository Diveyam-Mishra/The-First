import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import path from "path";

const connectionString = decodeURIComponent(process.env.AZURE_STORAGE_CONNECTION_STRING);
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_BLOB_CONTAINER_NAME);

const uploadToAzureBlob = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const blobName = path.basename(localFilePath);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadFile(localFilePath);

        // File successfully uploaded, delete the local file
        fs.unlinkSync(localFilePath);

        // Return the blob URL or any other details
        return blockBlobClient.url;

    } catch (error) {
        // If upload fails, delete the local file and log the error
        fs.unlinkSync(localFilePath);
        console.error("Error uploading file to Azure Blob Storage:", error);
        return null;
    }
};

export { uploadToAzureBlob };