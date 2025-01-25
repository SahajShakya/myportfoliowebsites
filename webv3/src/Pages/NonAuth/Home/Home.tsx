import { useUser } from "../../../context/UserContext";

const Home = () => {
  const { user } = useUser();

  return (
    <div>
      <h1>Home {user?.name || "Loading..."}</h1>
    </div>
  );
};

export default Home;
