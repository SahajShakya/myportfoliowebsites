// src/layouts/DefaultLayout.tsx
import { Outlet } from "react-router-dom";
import Nav from "../../Components/NavBar/Nav";

const DefaultLayout = () => {
  return (
    <div className="relative">
      <Nav />
      <div className="pt-px">
        <Outlet />
      </div>
    </div>
  );
};

export default DefaultLayout;
