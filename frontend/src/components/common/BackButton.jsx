import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ to, label }) => {
  return (
    <Link to={to} className="btn-outline">
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Link>
  );
};

export default BackButton;

