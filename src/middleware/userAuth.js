middleware/userAuth.js
// For simplicity, use a header X-User-Id (since you are not hashing or issuing JWT yet).
// You can swap to JWT later without changing controllers.

import User from '../models/User.js'

export async function userAuth(req, res, next) {
const userId = req.header('x-user-id')
if (!userId) return res.status(401).json({ error: 'unauthorized' })
const user = await User.findById(userId)
if (!user) return res.status(401).json({ error: 'unauthorized' })
req.user = user
next()
}