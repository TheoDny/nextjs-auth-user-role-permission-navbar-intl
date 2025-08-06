import { prisma } from "@/lib/prisma"
import { FileDb } from "@/prisma/generated"
import fs from "fs-extra"
import path from "path"
import sharp from "sharp"

const STORAGE_PATH = process.env.STORAGE_PATH || "./storage"

export type OptionSaveFile = {
    imgMaxWidth: number
    imgMaxHeight: number
}

export async function saveFile(file: File, filePath: string, option: OptionSaveFile): Promise<FileDb> {
    // Ensure storage directory exists
    const fullPath = path.join(STORAGE_PATH, filePath)
    await fs.ensureDir(path.normalize(fullPath))

    // Generate a unique filename
    const originalFileName = file.name.replace(/\s+/g, "-")
    const fileName = `${Date.now()}-${originalFileName}`
    const fullFilePath = path.join(fullPath, fileName)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check if file is an image
    const isImage = file.type.startsWith("image/")

    if (isImage) {
        // Process image with sharp
        const image = sharp(buffer)
        const metadata = await image.metadata()

        // Resize if needed
        if (
            (metadata.width && metadata.width > option.imgMaxWidth) ||
            (metadata.height && metadata.height > option.imgMaxHeight)
        ) {
            await image
                .resize({
                    width: option.imgMaxWidth,
                    height: option.imgMaxHeight,
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .toFile(fullFilePath)
        } else {
            // Save original image if no resize needed
            await fs.writeFile(fullFilePath, buffer)
        }
    } else {
        // Save non-image file directly
        await fs.writeFile(fullFilePath, buffer)
    }

    // Create database record
    const fileDb = await prisma.fileDb.create({
        data: {
            type: file.type,
            name: originalFileName,
            path: fullFilePath,
        },
    })

    return fileDb
}

export async function deleteFile(fileId: string, onlyDb: boolean = false): Promise<FileDb> {
    const file = await prisma.fileDb.findUnique({
        where: { id: fileId },
    })

    if (!file) {
        throw new Error("File not found")
    }

    const fullPath = path.join(STORAGE_PATH, file.path)

    if (!onlyDb) {
        // Delete file from storage
        try {
            await fs.remove(fullPath)
        } catch (error) {
            console.error(`Failed to delete file ${file.name} (${file.path}):`, error)
        }
    }
    // Delete file record from database
    return await prisma.fileDb.delete({
        where: { id: fileId },
    })
}

export async function deleteFiles(fileIds: string[], onlyDb: boolean = false) {
    const files = await prisma.fileDb.findMany({
        where: {
            id: { in: fileIds },
        },
    })

    if (!files || files.length === 0) {
        throw new Error("Files not found")
    }

    if (!onlyDb) {
        for (const file of files) {
            // Delete file from storage
            try {
                await fs.remove(file.path)
            } catch (error) {
                console.error(`Failed to delete file ${file.name} (${file.path}):`, error)
            }
        }
    }

    // Delete file records from database
    return await prisma.fileDb.deleteMany({
        where: {
            id: { in: fileIds },
        },
    })
}

export async function getFileById(fileId: string) {
    // Retrieve file data from database
    const file = await prisma.fileDb.findUnique({
        where: { id: fileId },
    })

    if (!file) {
        return null
    }

    // Read file from storage
    const fullPath = file.path

    try {
        const data = await fs.readFile(fullPath)

        return {
            ...file,
            data,
        }
    } catch (error) {
        console.error(`Failed to read file ${file.id} at ${fullPath}:`, error)
        return null
    }
}

export async function getFileByPath(filePath: string) {
    try {
        const data = await fs.readFile(filePath)

        return data
    } catch (error) {
        console.error(`Failed to read file at ${filePath}:`, error)
        return null
    }
}
