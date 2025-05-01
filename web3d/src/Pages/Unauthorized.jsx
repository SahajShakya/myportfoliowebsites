import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Unauthorized = () => {
    const { user } = useUser();
    console.log(user);
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-red-600">Unauthorized Access</h1>
        <p className="mt-4 text-lg text-gray-700">You do not have permission to view this page.</p>
        <p className="mt-6 text-gray-500">
          Please <Link to="/vitra" className="text-blue-500 hover:underline">log in</Link> with the appropriate credentials.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;