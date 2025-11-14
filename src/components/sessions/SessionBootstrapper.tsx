import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SessionBootstrapper = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    console.log('📍 SessionBootstrapper: User authenticated', user.id);
    // Session management will be rebuilt
  }, [user]);

  return null;
};

export default SessionBootstrapper;
