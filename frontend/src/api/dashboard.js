import client from './client'
export const getCampaignRoi = ({ startDate, endDate } = {}) => client.get('/dashboard/campaign-roi', { params: { startDate, endDate } }).then(r => r.data)
export const getLeadershipSummary = () => client.get('/dashboard/summary').then(r => r.data)
