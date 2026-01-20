import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { siteService } from '../services/site'

export const useSites = () => {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await siteService.list()
      return response.data
    }
  })
}

export const useSite = (id) => {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: async () => {
      const response = await siteService.get(id)
      return response.data
    },
    enabled: !!id
  })
}

export const useCreateSite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: siteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    }
  })
}

export const useUpdateSite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => siteService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    }
  })
}

export const useDeleteSite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: siteService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    }
  })
}

export const useRunSite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: siteService.run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    }
  })
}

export const usePauseSite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: siteService.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    }
  })
}

export const useResumeSite = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: siteService.resume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    }
  })
}
