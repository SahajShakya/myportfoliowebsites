import api from "./client";

export const uploadFiles = async (files, basePath = "") => {
  try {
    const formData = new FormData();
    formData.append("basePath", basePath);

    for (const fileObj of files) {
      const file = fileObj.file;
      if (!file || !file.name) {
        console.error("Invalid file detected. Skipping.", fileObj);
        continue;
      }
      formData.append("files[]", file);
    }

    const data = await api.postForm("/upload", formData);
    return data.files || [];
  } catch (error) {
    console.error("Error uploading files:", error.message);
    return [];
  }
};

export const uploadFilesToSupabase = uploadFiles;

export const deleteFile = async (fileUrl) => {
  try {
    const url =
      typeof fileUrl === "string"
        ? fileUrl
        : fileUrl.publicUrl || fileUrl.url || fileUrl;
    await api.delete("/upload", { body: { path: url } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error.message);
    return { success: false, message: error.message };
  }
};

export const deleteFilesFromSupabase = async (fileUrls) => {
  try {
    const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
    for (const fileObj of urls) {
      if (typeof fileObj === "object" && fileObj.publicUrl) {
        await deleteFile(fileObj.publicUrl);
      } else if (typeof fileObj === "string") {
        await deleteFile(fileObj);
      }
    }
    return { success: true, message: "Files deleted successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
