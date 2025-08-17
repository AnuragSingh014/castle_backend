import User from '../models/User.js'

export async function saveDashboardData(req, res) {
  try {
    const { id } = req.params
    const updates = req.body || {}
    const user = await User.findByIdAndUpdate(id, { $set: { dashboardData: updates } }, { new: true })
    if (!user) return res.status(404).json({ error: 'user_not_found' })
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', details: err.message })
  }
}

