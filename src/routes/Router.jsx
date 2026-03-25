import { createHashRouter, RouterProvider } from "react-router-dom";
import ControllerScreen from "../pages/ControllerScreen";
import Camera from "../pages/CameraScreen";
import StartupScreen from "../pages/StartupScreen";

export default function Router() {
  const router = createHashRouter([
    { path: "/", element: <StartupScreen /> },
    { path: "/tv", element: <ControllerScreen /> },
    { path: "/camera", element: <Camera /> },
  ]);
  return <RouterProvider router={router} />;
}
