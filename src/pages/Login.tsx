
import React from 'react';
import { Navigate } from 'react-router-dom';

const Login: React.FC = () => {
  // Redirect to auth/login
  return <Navigate to="/auth/login" replace />;
};

export default Login;
