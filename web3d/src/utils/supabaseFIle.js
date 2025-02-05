import { supabase } from "../supabase/supabase";

// Function to upload multiple files to Supabase Storage
export const uploadFilesToSupabase = async (files) => {
  // const date = new Date();
  // const uploadedUrls = [];

  try {
    // for (const file of files) {
    //   // Validate file.name and handle cases where it might be undefined or empty
    //   console.log(file);
    //   if (!file.file?.name) {
    //     console.error("File is missing. Skipping this file.");
    //     continue; // Skip this file if name is missing
    //   }
    //   // Extract extension from file name or fallback to a default extension
    //   const fileExtension = file.file?.name?.split(".").pop() || "jpg"; // Default to .jpg if no extension
    //   const fileName = `${date.toISOString().replace(/[:.-]/g, "")}_${
    //     file?.file?.name //|| `file.${fileExtension}`
    //   }`;
    //   const fileName = file.file?.name;
    //   console.log("Filename", fileName);
    //   // Upload each file to Supabase Storage
    //   const { data: Upload, error } = await supabase.storage
    //     .from("storage") // replace with your actual bucket name
    //     .upload(fileName, file);
    //   console.log("Upload: ", Upload);
    //   if (error) {
    //     console.error("Upload error: ", error.message);
    //     throw error;
    //   }
    //   // After upload success, retrieve the public URL
    //   const { data: publicURL, error: urlError } = supabase.storage
    //     .from("storage")
    //     .getPublicUrl(fileName);
    //   console.log("Public URL: ", publicURL);
    //   if (urlError) {
    //     console.error("URL fetch error: ", urlError.message);
    //     throw urlError;
    //   }
    //   uploadedUrls.push(publicURL); // Save the URL to the array
    // }
    // return uploadedUrls;

    // const uploadPromises = files.map(async (fileObj) => {
    //   const file = fileObj.file;

    //   // Create a timestamp (you can use Date.now() or a custom format)
    //   const timestamp = Date.now(); // This generates a unique number based on the current time
    //   const uniqueFileName = `${timestamp}-${file.name}`; // Append timestamp to the file name

    //   // Upload file with the unique file name
    //   const { data, error } = await supabase.storage
    //     .from("storage") // replace with your bucket name
    //     .upload(uniqueFileName, file);

    //   if (error) {
    //     throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    //   }

    //   return data; // Return the uploaded file data
    // });

    // // Wait for all uploads to finish
    // const results = await Promise.all(uploadPromises);

    // // Log all results of the uploads
    // console.log("All files uploaded successfully:", results);

    const uploadPromises = files.map(async (fileObj) => {
      const file = fileObj.file;

      // Create a timestamp (you can use Date.now() or a custom format)
      const timestamp = Date.now(); // This generates a unique number based on the current time
      const uniqueFileName = `${timestamp}-${file.name}`; // Append timestamp to the file name

      // Upload file with the unique file name
      const { data, error } = await supabase.storage
        .from("storage") // replace with your bucket name
        .upload(uniqueFileName, file);

      if (error) {
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      // Fetch the public URL for the uploaded file
      const { data: publicURL, error: urlError } = supabase.storage
        .from("storage")
        .getPublicUrl(uniqueFileName);

      if (urlError) {
        throw new Error(
          `Failed to get public URL for ${file.name}: ${urlError.message}`
        );
      }
      console.log("url obttained", publicURL);
      // Return the public URL
      return publicURL;
    });

    // Wait for all uploads to finish and collect the URLs
    try {
      const uploadedUrls = await Promise.all(uploadPromises);

      // Log all URLs of the uploaded files
      console.log("All files uploaded successfully. URLs: ", uploadedUrls);

      return uploadedUrls; // Return the list of URLs
    } catch (error) {
      console.error("Error uploading files:", error.message);
      return [];
    }
  } catch (error) {
    console.error("Error uploading files:", error.message);
    return [];
  }
};

// Function to delete a file from Supabase Storage
export const deleteFileFromSupabase = async (fileUrl) => {
  try {
    // Extract the file name from the file URL (extract path after storage URL)
    const fileName = fileUrl.split("/").pop();

    if (!fileName) {
      throw new Error("Invalid file URL");
    }

    // Define your bucket name (replace with your actual bucket name)
    const bucketName = "storage"; // Make sure to use the correct bucket name

    // Use Supabase Storage API to delete the file from the specified bucket
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]); // Remove the file by its name

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
