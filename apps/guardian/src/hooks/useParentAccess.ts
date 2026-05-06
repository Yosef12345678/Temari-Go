import { useMemo } from 'react';

import { useStudentsList } from '@/src/hooks/useStudents';

export function useParentAccess() {
  const studentsQuery = useStudentsList();

  const hasChildren = useMemo(() => (studentsQuery.data ?? []).length > 0, [studentsQuery.data]);
  const isResolving = studentsQuery.isLoading || studentsQuery.isFetching;
  const isRestricted = !isResolving && !studentsQuery.error && !hasChildren;

  return {
    hasChildren,
    isRestricted,
    isResolving,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,
  };
}
