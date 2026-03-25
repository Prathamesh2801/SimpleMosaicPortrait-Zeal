import axios from "axios";
import { BASE_URL } from "../../config";

export const submitToAPI = async ({ name, image }) => {
  const formData = new FormData();

  formData.append("Name", name);
  formData.append("image", image);

  try {
    const res = await axios.post(`${BASE_URL}/sse_api.php`, formData, {
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (res.status === 200 && res.data?.status === "success") {
      return res.data; // ✅ return actual data
    }

    // ❗ THROW instead of returning false
    throw new Error("Upload failed");
  } catch (err) {
    console.error(err);
    throw err; // ❗ VERY IMPORTANT
  }
};
