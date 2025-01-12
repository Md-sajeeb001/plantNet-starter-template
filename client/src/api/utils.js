import axios from "axios";

export const imageUpload = async (imageData) => {
  const formDate = new FormData();
  formDate.append("image", imageData);

  const { data } = await axios.post(
    `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMAGE_API_KEY}`,
    formDate
  );
  return data.data?.display_url;
};
