import { supabase } from "../supabase/supabase";

// Function to upload multiple files to Supabase Storage
export const uploadFilesToSupabase = async (files) => {
  const date = new Date();
  const uploadedUrls = [];

  try {
    for (const file of files) {
      const fileName = `${date.toISOString().replace(/[:.-]/g, "")}_${
        file.name
      }`; // Unique file name

      // Upload each file to Supabase Storage
      const { data: Upload, error } = await supabase.storage
        .from("storage") // replace with your actual bucket name
        .upload(fileName, file);

      console.log("Upload: ", Upload);

      if (error) {
        console.error("Upload error: ", error.message);
        throw error;
      }

      // After upload success, retrieve the public URL
      const { data: publicURL, error: urlError } = supabase.storage
        .from("storage")
        .getPublicUrl(fileName);

      console.log("Public URL: ", publicURL);

      if (urlError) {
        console.error("URL fetch error: ", urlError.message);
        throw urlError;
      }

      uploadedUrls.push(publicURL); // Save the URL to the array
    }

    return uploadedUrls;
  } catch (error) {
    console.error("Error uploading files:", error.message);
    return [];
  }
};

export const deleteFileFromSupabase = async (fileUrl) => {
  try {
    // Extract the file name or path from the file URL
    const fileName = fileUrl.split("/").pop();

    if (!fileName) {
      throw new Error("Invalid file URL");
    }

    // Define your bucket name (replace with your actual bucket name)
    const bucketName = "your-bucket-name";

    // Use Supabase Storage API to delete the file from the specified bucket
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]); // Removes the file by its name

    if (error) {
      throw new Error(error.message); // Throw error if any issue occurs
    }

    console.log(`File ${fileName} deleted successfully from Supabase`);
    return true;
  } catch (error) {
    console.error("Error deleting file from Supabase:", error.message);
    return false;
  }
};
