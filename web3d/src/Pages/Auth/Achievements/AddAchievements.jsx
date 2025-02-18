/* eslint-disable react/prop-types */
import { useState } from "react";
import { Formik, Form, FieldArray } from "formik";
import InputField from "../../../Components/Input/InputField";
import MyEditor from "../../../Components/MyEditor/MyEditor";
import Upload from "../../../Components/Upload/Upload";
import { motion } from "framer-motion";
import { uploadFilesToSupabase } from "../../../utils/supabaseFIle";
import { db } from "../../../firebase/firebase";
import { useSnackbar } from "notistack";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

const Card = ({ children, className }) => {
  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-md border border-black ${className}`}
    >
      {children}
    </div>
  );
};

const AddAchievements = ({ editData }) => {
  const [editorValue, setEditorValue] = useState(editData?.contents || "");
  // const [uploadUrls, setUploadUrls] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  const initialValues = {
    name: editData?.name || "",
    description: editData?.description || "",
    tags: editData?.tags || "",
    icons: editData?.icons ? [{ icon: editData?.icons?.publicUrl }] : [],
    link: editData?.link || false,
    source_code_link: editData?.source_code_link || "",
    contents: editData?.contents || "",
    info: editData?.info || [
      {
        achievement_id: "",
        icons: [],
        contents: "",
      },
    ],
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      let uploadedUrls = [];
      if (values.icons) {
        uploadedUrls = await uploadFilesToSupabase(
          values.icons,
          "achievements"
        );
      }

      const achievementData = {
        name: values.name,
        description: values.description,
        tags: values.tags.map((tag) => tag),
        icons: uploadedUrls[0] || "",
        link: values.link || true,
        contents: values.contents,
        source_code_link: values.source_code_link,
      };

      if (editData) {
        const achievementRef = doc(db, "achievements", editData.id);
        await updateDoc(achievementRef, achievementData);
        enqueueSnackbar("Achievement updated successfully!", {
          variant: "success",
        });
      } else {
        const achievementRef = await addDoc(
          collection(db, "achievements"),
          achievementData
        );
        const achievementId = achievementRef.id;

        const achievementDetailsData = [];
        for (let info of values.info) {
          let infoIconsUrls = [];
          if (info.icons) {
            infoIconsUrls = await uploadFilesToSupabase(
              info.icons,
              "achievements"
            );
          }

          achievementDetailsData.push({
            achievement_id: achievementId,
            icons: infoIconsUrls,
            contents: info.contents,
          });
        }

        await Promise.all(
          achievementDetailsData.map(async (detail) => {
            await addDoc(collection(db, "achievementDetails"), detail);
          })
        );

        enqueueSnackbar("Achievement added successfully!", {
          variant: "success",
        });
      }

      resetForm();
      setSubmitting(false);
    } catch (error) {
      console.error("Error adding achievement:", error);
      enqueueSnackbar("Failed to submit achievement data. Please try again.", {
        variant: "error",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">
        {editData ? "Edit Achievement" : "Add Achievement"}
      </h2>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ setFieldValue, values, touched, errors, handleBlur }) => (
          <Form className="space-y-6">
            <InputField
              name="name"
              type="text"
              label="Achievement Name"
              value={values.name}
              onChange={(e) => setFieldValue("name", e.target.value)}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
            />

            <InputField
              name="description"
              type="text"
              label="Description"
              value={values.description}
              onChange={(e) => setFieldValue("description", e.target.value)}
              onBlur={handleBlur}
              error={errors.description}
              touched={touched.description}
            />

            {/* Don't show the tags and image section in edit mode */}
            <Card>
              <FieldArray
                name="tags"
                render={(arrayHelpers) => (
                  <div className="space-y-4">
                    {values.tags && values.tags.length > 0 ? (
                      values.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4"
                        >
                          <input
                            name={`tags[${index}]`}
                            value={tag}
                            onChange={(e) =>
                              setFieldValue(`tags[${index}]`, e.target.value)
                            }
                            onBlur={handleBlur}
                            className="border p-2 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => arrayHelpers.remove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No tags available</p>
                    )}

                    <button
                      type="button"
                      onClick={() => arrayHelpers.push("")} // Adds an empty string to create a new tag
                      className="mt-2 text-blue-500 hover:text-blue-700"
                    >
                      Add Tag
                    </button>
                  </div>
                )}
              />
            </Card>

            <Upload
              name="icons"
              value={values.icons}
              setFieldValue={setFieldValue}
              error={errors.icons}
              touched={touched.icons}
            />

            <InputField
              name="source_code_link"
              type="url"
              label="Source Code Link"
              value={values.source_code_link}
              onChange={(e) =>
                setFieldValue("source_code_link", e.target.value)
              }
              onBlur={handleBlur}
              error={errors.source_code_link}
              touched={touched.source_code_link}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            <MyEditor
              value={editorValue}
              onChange={(content) => {
                setEditorValue(content);
                setFieldValue("contents", content);
              }}
              name="contents"
              error={errors.contents}
            />

            {/* Remove the info section for edit mode */}
            {!editData && (
              <Card>
                <FieldArray
                  name="info"
                  render={(arrayHelpers) => (
                    <div>
                      {values.info.map((info, index) => (
                        <div key={index} className="space-y-4">
                          <Upload
                            name={`info[${index}].icons`}
                            value={info.icons}
                            setFieldValue={setFieldValue}
                            error={errors.info?.[index]?.icons}
                            touched={touched.info?.[index]?.icons}
                          />

                          <MyEditor
                            value={info.contents}
                            onChange={(content) => {
                              setFieldValue(`info[${index}].contents`, content);
                            }}
                            name={`info[${index}].contents`}
                          />

                          <button
                            type="button"
                            onClick={() => arrayHelpers.remove(index)}
                          >
                            Remove Info
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          arrayHelpers.push({
                            achievement_id: "",
                            icons: [],
                            contents: "",
                          })
                        }
                      >
                        Add Info
                      </button>
                    </div>
                  )}
                />
              </Card>
            )}

            <motion.button
              type="submit"
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              Submit
            </motion.button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddAchievements;
