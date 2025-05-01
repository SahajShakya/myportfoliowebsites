import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';  // Firebase Auth instance
import { getDoc, doc } from 'firebase/firestore';  // Firestore functions
import { db } from '../../firebase/firebase';  // Your Firestore instance

const useAuthRedirect = () => {
  const navigate = useNavigate();  // Hook for navigating between routes

  useEffect(() => {
    const user = auth.currentUser;  // Get the current user from Firebase Auth
    if (!user) {
      navigate('/vitra');  // Redirect to login if no user is found
      return;
    }

    if (!user.emailVerified) {
      navigate('/isVerified');  // Redirect to the verification page if email is not verified
      return;
    }

    // Fetch user role from Firestore
    const fetchUserRole = async () => {
      try {
        // Get the user document from Firestore using the user's UID
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData?.role;

          // Redirect based on role
          if (role === '4') {
            navigate('/patient/dashboard');
          } else if (role === '3') {
            navigate('/doctor/dashboard');
          } else if (role === '2') {
            navigate('/employee/dashboard');
          } else if (role === '1') {
            navigate('/admin/dashboard');
          } else {
            navigate('/home');  // Default case if no role found
          }
        } else {
          console.log('No such user!');
        }
      } catch (error) {
        console.error('Error fetching user role: ', error);
      }
    };

    // Call the function to fetch user role
    fetchUserRole();
  }, [navigate]);  // This effect runs on initial mount

};

export default useAuthRedirect;
