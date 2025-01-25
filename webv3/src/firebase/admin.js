import admin from "firebase-admin";
import { readFile } from "fs/promises";
import { resolve } from "path";
import inquirer from "inquirer";  // Import inquirer


// Initialize Firebase Admin SDK (only once)
if (admin.apps.length === 0) {
  const serviceAccountPath = resolve("./firebaseAdmin.json"); // Adjust path as needed

  // Read the service account key file
  const serviceAccount = JSON.parse(await readFile(serviceAccountPath, "utf-8"));

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.log("Firebase app already initialized.");
}

// Initialize Firestore from firebase-admin
const db = admin.firestore();

// User details and admin role
// const adminEmail = "kasthamandaplifecareclinic@gmail.com";
const role = "Admin";

// Function to handle user actions (create, update, delete)
const handleAdminUserAction = async (action) => {


  try {
    let userRecord;

    switch (action) {
      case "1": // Create user
        try {
          const { email } = await inquirer.prompt([{
            type: "text",
            name: "email",
            message: "Enter the admin Email to create the admin user:",
          },
        ]);
          // Check if the email already exists
          try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log("Email is already in use. User already exists. No need to create a new user.");
            return;  // Exit the function early if user already exists
          } catch (error) {
            if (error.code !== "auth/user-not-found") {
              throw error;  // Other errors
            }
          }

    

          // New password input via inquirer with masking
          const { newPassword } = await inquirer.prompt([
            {
              type: "password",
              name: "newPassword",
              message: "Enter the new password to create the admin user:",
              mask: "*", // Mask the input
            },
          ]);

          // Create the new user
          userRecord = await admin.auth().createUser({
            email: email,
            password: newPassword,
            displayName: role,
            emailVerified: true,
            disabled: false,
          });

          console.log("Successfully created new admin user:", userRecord.uid);

          // Add the new user to Firestore
          await db.collection("users").add({
            uid: userRecord.uid,
            email: userRecord.email,
            name: userRecord.displayName,
            role: 1,
            createdAt: new Date(),
            isLoggedIn: false,
            lastLogin: null,
          });

          console.log("Successfully added new admin user to Firestore");

          // Set custom claims to designate this user as admin
          await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

          console.log("Successfully set custom claims for admin user:", userRecord.uid);
        } catch (error) {
          console.error("Error creating admin user:", error);
        }
        break;

      case "2": // Update user
        try {
          // Attempt to get the existing user by email
          try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log("User found, proceeding to update password...");

            // Ask for a new password only if the user exists
            const { newUserPassword } = await inquirer.prompt([
              {
                type: "password",
                name: "newUserPassword",
                message: "Enter the new password to update the admin user:",
                mask: "*", // Mask the input
              },
            ]);

            // Update the existing user's password
            userRecord = await admin.auth().updateUser(userRecord.uid, {
              password: newUserPassword,
              displayName: "Admin User",
              emailVerified: true,
            });

            console.log("Successfully updated admin user password:", userRecord.uid);
          } catch (error) {
            if (error.code === "auth/user-not-found") {
              console.log("User not found, cannot update.");
            } else {
              console.error("Error updating admin user:", error);
            }
          }
        } catch (error) {
          console.error("Error during update operation:", error);
        }
        break;

      case "3": // Delete user
        try {
          // Attempt to get the existing user by email
          try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log("User found, proceeding to delete...");

            // Ask for confirmation before deleting only if user exists
            const { confirmation } = await inquirer.prompt([
              {
                type: "confirm",
                name: "confirmation",
                message: "Are you sure you want to delete the admin user?",
                default: false,
              },
            ]);

            if (confirmation) {
              // Delete the user from Firebase Authentication
              await admin.auth().deleteUser(userRecord.uid);

              console.log("Successfully deleted admin user from Firebase Auth:", userRecord.uid);

              // Delete the user from Firestore
              const snapshot = await db.collection("users").where("uid", "==", userRecord.uid).get();
              snapshot.forEach(async (doc) => {
                await doc.ref.delete();
              });

              console.log("Successfully deleted admin user from Firestore");
            } else {
              console.log("Deletion cancelled.");
            }
          } catch (error) {
            if (error.code === "auth/user-not-found") {
              console.log("User not found in Firebase Authentication.");
            } else {
              console.error("Error deleting admin user from Firebase Auth:", error);
            }
          }
        } catch (error) {
          console.error("Error during delete operation:", error);
        }
        break;

      default:
        console.log("Invalid action.");
    }
  } catch (error) {
    console.error("Error handling admin user action:", error);
  }
};

// Prompt user for action
const askUserAction = async () => {
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Please choose an option:",
      choices: [
        { name: "Create a new admin user", value: "1" },
        { name: "Update admin user password", value: "2" },
        { name: "Delete admin user", value: "3" },
      ],
    },
  ]);

  handleAdminUserAction(choice)
    .then(() => {
      console.log("Action completed successfully.");
    })
    .catch((error) => {
      console.error("Error: ", error);
    });
};

// Start the prompt
askUserAction();