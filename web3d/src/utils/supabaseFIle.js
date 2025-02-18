import { supabase } from "../supabase/supabase";

// Function to upload multiple files to Supabase Storage
// export const uploadFilesToSupabase = async (files) => {
//   // const date = new Date();
//   // const uploadedUrls = [];

//   try {
//     // for (const file of files) {
//     //   // Validate file.name and handle cases where it might be undefined or empty
//     //   console.log(file);
//     //   if (!file.file?.name) {
//     //     console.error("File is missing. Skipping this file.");
//     //     continue; // Skip this file if name is missing
//     //   }
//     //   // Extract extension from file name or fallback to a default extension
//     //   const fileExtension = file.file?.name?.split(".").pop() || "jpg"; // Default to .jpg if no extension
//     //   const fileName = `${date.toISOString().replace(/[:.-]/g, "")}_${
//     //     file?.file?.name //|| `file.${fileExtension}`
//     //   }`;
//     //   const fileName = file.file?.name;
//     //   console.log("Filename", fileName);
//     //   // Upload each file to Supabase Storage
//     //   const { data: Upload, error } = await supabase.storage
//     //     .from("storage") // replace with your actual bucket name
//     //     .upload(fileName, file);
//     //   console.log("Upload: ", Upload);
//     //   if (error) {
//     //     console.error("Upload error: ", error.message);
//     //     throw error;
//     //   }
//     //   // After upload success, retrieve the public URL
//     //   const { data: publicURL, error: urlError } = supabase.storage
//     //     .from("storage")
//     //     .getPublicUrl(fileName);
//     //   console.log("Public URL: ", publicURL);
//     //   if (urlError) {
//     //     console.error("URL fetch error: ", urlError.message);
//     //     throw urlError;
//     //   }
//     //   uploadedUrls.push(publicURL); // Save the URL to the array
//     // }
//     // return uploadedUrls;

//     // const uploadPromises = files.map(async (fileObj) => {
//     //   const file = fileObj.file;

//     //   // Create a timestamp (you can use Date.now() or a custom format)
//     //   const timestamp = Date.now(); // This generates a unique number based on the current time
//     //   const uniqueFileName = `${timestamp}-${file.name}`; // Append timestamp to the file name

//     //   // Upload file with the unique file name
//     //   const { data, error } = await supabase.storage
//     //     .from("storage") // replace with your bucket name
//     //     .upload(uniqueFileName, file);

//     //   if (error) {
//     //     throw new Error(`Failed to upload ${file.name}: ${error.message}`);
//     //   }

//     //   return data; // Return the uploaded file data
//     // });

//     // // Wait for all uploads to finish
//     // const results = await Promise.all(uploadPromises);

//     // // Log all results of the uploads
//     // console.log("All files uploaded successfully:", results);

//     const uploadPromises = files.map(async (fileObj) => {
//       const file = fileObj.file;

//       // Create a timestamp (you can use Date.now() or a custom format)
//       const timestamp = Date.now(); // This generates a unique number based on the current time
//       const uniqueFileName = `${timestamp}-${file.name}`; // Append timestamp to the file name

//       // Upload file with the unique file name
//       const { data, error } = await supabase.storage
//         .from("storage") // replace with your bucket name
//         .upload(uniqueFileName, file);

//       if (error) {
//         throw new Error(`Failed to upload ${file.name}: ${error.message}`);
//       }

//       // Fetch the public URL for the uploaded file
//       const { data: publicURL, error: urlError } = supabase.storage
//         .from("storage")
//         .getPublicUrl(uniqueFileName);

//       if (urlError) {
//         throw new Error(
//           `Failed to get public URL for ${file.name}: ${urlError.message}`
//         );
//       }
//       console.log("url obttained", publicURL);
//       // Return the public URL
//       return publicURL;
//     });

//     // Wait for all uploads to finish and collect the URLs
//     try {
//       const uploadedUrls = await Promise.all(uploadPromises);

//       // Log all URLs of the uploaded files
//       console.log("All files uploaded successfully. URLs: ", uploadedUrls);

//       return uploadedUrls; // Return the list of URLs
//     } catch (error) {
//       console.error("Error uploading files:", error.message);
//       return [];
//     }
//   } catch (error) {
//     console.error("Error uploading files:", error.message);
//     return [];
//   }
// };
export const uploadFilesToSupabase = async (files, basePath) => {
  const uploadedUrls = [];
  const timestamp = Date.now(); // This generates a unique number based on the current time

  try {
    // Iterate through the files and upload each one after validating its properties
    for (const fileObj of files) {
      const file = fileObj.file;

      // Check if the file is defined and has a valid name
      if (!file || !file.name) {
        console.error("Invalid file detected. Skipping this file.", file);
        continue; // Skip the file if it is invalid
      }

      // Log file name to help debug
      console.log("Uploading file:", file.name);

      // Create a unique file name by appending a timestamp
      const uniqueFileName = `${basePath}/${timestamp}-${file.name}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from("storage") // Replace with your actual bucket name
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

      // Log the public URL and add to the array
      console.log("File uploaded successfully. Public URL:", publicURL);
      uploadedUrls.push(publicURL);
    }

    return uploadedUrls; // Return all uploaded file URLs
  } catch (error) {
    console.error("Error uploading files:", error.message);
    return [];
  }
};

// Function to delete a file from Supabase Storage
export const deleteFilesFromSupabase = async (fileUrls) => {
  try {
    // Ensure fileUrls is an array, if it's a single file, convert it into an array
    const files = Array.isArray(fileUrls) ? fileUrls : [fileUrls];

    // Iterate over the fileUrls array and delete each file
    for (const fileObj of files) {
      // Check if the object has the publicUrl field and it's a string
      if (!fileObj.publicUrl || typeof fileObj.publicUrl !== "string") {
        throw new Error(
          'Each object must have a valid "publicUrl" field that is a string'
        );
      }

      const url = fileObj.publicUrl;
      // Extract the file path from the URL
      const parts = url.split(`/storage/v1/object/public/storage/`);

      // Check if the URL is in the expected format
      if (parts.length < 2) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      const filePath = parts[1];

      // Perform the delete operation
      const { error } = await supabase.storage
        .from("storage") // Specify the bucket name here
        .remove([filePath]);

      if (error) {
        console.error("Error deleting file:", error.message);
        return { success: false, message: error.message };
      }
    }

    return { success: true, message: "Files deleted successfully" };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, message: error.message };
  }
};
