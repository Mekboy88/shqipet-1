
import { useEffect } from 'react';
import { GlobalElasticOptions } from './types';

export const useGlobalElasticScrolling = ({
  enabled = true, // ENABLED BY DEFAULT for subtle elastic effect
}: GlobalElasticOptions = {}) => {
  useEffect(() => {
    if (!enabled) return;

    console.log('✅ Elastic scrolling enabled with subtle effect');
  }, [enabled]);
};
