import client from './client'

export const parseHar = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/har/parse', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export const generateFlow = (selectedEntries) => client.post('/har/generate-flow', selectedEntries)
