import { createHashRouter, RouterProvider } from "react-router-dom";
import ControllerScreen from "../pages/ControllerScreen";
import Camera from "../pages/CameraScreen";
import StartupScreen from "../pages/StartupScreen";
import SubmitFormScreen from "../pages/SubmitFormScreen";

export default function Router() {
  const router = createHashRouter([
    { path: "/", element: <StartupScreen /> },
    { path: "/tv", element: <ControllerScreen /> },
    { path: "/camera", element: <Camera /> },
    { path: "/form", element: <SubmitFormScreen /> },
  ]);
  return <RouterProvider router={router} />;
}
