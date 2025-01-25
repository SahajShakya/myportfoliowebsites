// src/layouts/DefaultLayout.tsx
import { Outlet } from "react-router-dom";
import Nav from "../../Components/NavBar/Nav";

const DefaultLayout = () => {
  return (
    <div>
      <Nav />
      <Outlet />
    </div>
  );
};

export default DefaultLayout;
