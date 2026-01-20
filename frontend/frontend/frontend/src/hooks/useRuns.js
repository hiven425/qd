import { useQuery } from '@tanstack/react-query'
import { runService } from '../services/run'

export const useRuns = (siteId) => {
  return useQuery({
    queryKey: ['runs', siteId],
    queryFn: async () => {
      const response = await runService.listBySite(siteId)
      return response.data
    },
    enabled: !!siteId
  })
}

export const useRun = (runId) => {
  return useQuery({
    queryKey: ['runs', runId],
    queryFn: async () => {
      const response = await runService.get(runId)
      return response.data
    },
    enabled: !!runId
  })
}
