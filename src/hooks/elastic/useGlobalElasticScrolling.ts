
import { useEffect } from 'react';
import { GlobalElasticOptions } from './types';

export const useGlobalElasticScrolling = ({
  enabled = false, // DISABLED BY DEFAULT
}: GlobalElasticOptions = {}) => {
  useEffect(() => {
    // COMPLETELY DISABLED - DO NOTHING
    console.log('🚫 Elastic scrolling COMPLETELY DISABLED');
    return;
  }, [enabled]);
};
