// src/layouts/DefaultLayout.tsx
import { Outlet } from "react-router-dom";
import Nav from "../../Components/NavBar/Nav";

const DefaultLayout = () => {
  return (
    <div className="relative bg-gray-200">
      <Nav />
      <div className="pt-[80px]">
        <Outlet />
      </div>
    </div>
  );
};

export default DefaultLayout;
