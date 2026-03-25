import axios from "axios";
import { BASE_URL } from "../../config";

export const submitToAPI = async ({ name = "DEV101", image }) => {
  const formData = new FormData();

  formData.append("Name", name);
  formData.append("image", image);

  try {
    const res = await axios.post(`${BASE_URL}/sse_api.php`, formData, {
      validateStatus: (s) => s >= 200 && s < 500,
    });

    const data = {
      fullName,
      comment,
      filePath: BASE_URL + "/" + res.data.file_result.file_path,
      fileName: res.data.file_result.file_name,
    };

    if (res.status === 200 && res.data?.status === "success") {
      return {
        success: true,
        data,
      };
    }

    return { success: false };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
