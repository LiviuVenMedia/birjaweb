'use strict'

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('redis')

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
const CF_IMAGES_TOKEN = process.env.CF_IMAGES_TOKEN
const CF_IMAGES_ACCOUNT_HASH = process.env.CF_IMAGES_ACCOUNT_HASH
const CF_IMAGES_VARIANT = process.env.CF_IMAGES_VARIANT || 'public'

// Redis setup
const REDIS_URL = process.env.REDIS_URL
const redis = createClient(
    REDIS_URL
        ? { url: REDIS_URL }
        : {
            socket: {
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: Number(process.env.REDIS_PORT || 6379)
            }
        }
)
redis.on('error', (err) => console.error('Redis error:', err))
;(async () => {
    try{
        await redis.connect()
        console.log('Redis connected')
    }catch(err){
        console.error('Redis connect failed', err)
    }
})()
app.locals.redis = redis

function auth(requiredRole){
	return async (req, res, next) => {
		const authHeader = req.headers.authorization || ''
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
		if(!token) return res.status(401).json({ error: 'Unauthorized' })
		try{
			const payload = jwt.verify(token, JWT_SECRET)
			req.user = payload
			if(requiredRole && payload.role !== requiredRole) return res.status(403).json({ error: 'Forbidden' })
			return next()
		}catch(err){
			return res.status(401).json({ error: 'Invalid token' })
		}
	}
}

// Auth: register (employers only)
app.post('/api/auth/register', async (req, res) => {
	try{
		const { username, password } = req.body
		if(!username || !password) return res.status(400).json({ error: 'username and password required' })
		const exists = await prisma.user.findUnique({ where: { username } })
		if(exists) return res.status(409).json({ error: 'Username already taken' })
		const passwordHash = await bcrypt.hash(password, 10)
		const user = await prisma.user.create({ data: { username, passwordHash, role: 'EMPLOYER' } })
		return res.json({ id: user.id, username: user.username, role: user.role })
	}catch(err){
		return res.status(500).json({ error: 'Server error' })
	}
})

// Auth: login (employer or seeker)
app.post('/api/auth/login', async (req, res) => {
	try{
		const { username, password } = req.body
		if(!username || !password) return res.status(400).json({ error: 'username and password required' })
		const user = await prisma.user.findUnique({ where: { username } })
		if(!user) return res.status(401).json({ error: 'Invalid credentials' })
		const ok = await bcrypt.compare(password, user.passwordHash)
		if(!ok) return res.status(401).json({ error: 'Invalid credentials' })
		const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
		return res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
	}catch(err){
		return res.status(500).json({ error: 'Server error' })
	}
})

// Public: list all vacancies
app.get('/api/vacancies', async (req, res) => {
	const items = await prisma.vacancy.findMany({ orderBy: { createdAt: 'desc' } })
	return res.json(items)
})

// Employer: my vacancies
app.get('/api/employer/vacancies', auth('EMPLOYER'), async (req, res) => {
	const items = await prisma.vacancy.findMany({ where: { ownerId: req.user.id }, orderBy: { createdAt: 'desc' } })
	return res.json(items)
})

// Employer: create vacancy
app.post('/api/employer/vacancies', auth('EMPLOYER'), async (req, res) => {
	const { title, text, region, salary, profession, images } = req.body
	if(!title || !text || !region) return res.status(400).json({ error: 'Missing required fields' })
	let imagesField = null
	if (Array.isArray(images)) {
		try {
			imagesField = JSON.stringify(images)
		}catch{}
	}
	const item = await prisma.vacancy.create({ data: { title, text, region, salary, profession, images: imagesField, ownerId: req.user.id } })
	return res.json(item)
})

// Employer: update vacancy
app.put('/api/employer/vacancies/:id', auth('EMPLOYER'), async (req, res) => {
	const id = Number(req.params.id)
	const exists = await prisma.vacancy.findUnique({ where: { id } })
	if(!exists || exists.ownerId !== req.user.id) return res.status(404).json({ error: 'Not found' })
	const { title, text, region, salary, profession, images } = req.body
	let imagesField = undefined
	if (Array.isArray(images)) {
		try {
			imagesField = JSON.stringify(images)
		}catch{}
	}
	const item = await prisma.vacancy.update({ where: { id }, data: { title, text, region, salary, profession, ...(imagesField !== undefined ? { images: imagesField } : {}) } })
	return res.json(item)
})

// Employer: delete vacancy
app.delete('/api/employer/vacancies/:id', auth('EMPLOYER'), async (req, res) => {
	const id = Number(req.params.id)
	const exists = await prisma.vacancy.findUnique({ where: { id } })
	if(!exists || exists.ownerId !== req.user.id) return res.status(404).json({ error: 'Not found' })
	await prisma.application.deleteMany({ where: { offerId: id } })
	await prisma.vacancy.delete({ where: { id } })
	return res.json({ ok: true })
})

// Seeker: apply to vacancy
app.post('/api/applications', async (req, res) => {
	const { offerId, name, phone, region, interest, applicantId, contract, age, experience, salaryWorker, images } = req.body
	if(!offerId || !name || !phone || !region) return res.status(400).json({ error: 'Missing required fields' })
	const data = { offerId, name, phone, region, interest, applicantId }
	if (typeof contract === 'string' || contract === null) data.Contract = contract
	if (typeof age === 'number' || age === null) data.Age = age
	if (typeof experience === 'string' || experience === null) data.Experience = experience
	if (typeof salaryWorker === 'string' || salaryWorker === null) data.SalaryWorker = salaryWorker
	if (Array.isArray(images)) {
		try {
			data.images = JSON.stringify(images)
		}catch{}
	}
	const appItem = await prisma.application.create({ data })
	return res.json(appItem)
})

// Employer: update candidate (application)
app.put('/api/applications/:id', auth('EMPLOYER'), async (req, res) => {
	try{
		const id = Number(req.params.id)
		const exists = await prisma.application.findUnique({ where: { id }, include: { offer: true } })
		if(!exists) return res.status(404).json({ error: 'Not found' })
		if(exists.offer.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

		const { name, phone, region, interest, status, contract, age, experience, salaryWorker, applicantId, images } = req.body || {}
		const data = {}
		if(typeof name === 'string') data.name = name
		if(typeof phone === 'string') data.phone = phone
		if(typeof region === 'string') data.region = region
		if(typeof interest === 'string' || interest === null) data.interest = interest
		if(typeof status === 'string') data.status = status
		if(typeof contract === 'string' || contract === null) data.Contract = contract
		if(typeof age === 'number' || age === null) data.Age = age
		if(typeof experience === 'string' || experience === null) data.Experience = experience
		if(typeof salaryWorker === 'string' || salaryWorker === null) data.SalaryWorker = salaryWorker
		if(typeof applicantId === 'number' || applicantId === null) data.applicantId = applicantId
		if (Array.isArray(images)) {
			try {
				data.images = JSON.stringify(images)
			}catch{}
		}

		const updated = await prisma.application.update({ where: { id }, data, include: { offer: true } })
		return res.json(updated)
	}catch(err){
		return res.status(500).json({ error: 'Server error' })
	}
})

// Employer: list candidates for my vacancies
app.get('/api/employer/candidates', auth('EMPLOYER'), async (req, res) => {
	const items = await prisma.application.findMany({
		where: { offer: { ownerId: req.user.id } },
		orderBy: { createdAt: 'desc' },
		include: { offer: true }
	})
	return res.json(items)
})

// Health: Redis ping
app.get('/api/health/redis', async (req, res) => {
    try{
        const start = Date.now()
        const pong = await req.app.locals.redis.ping()
        return res.json({ status: 'ok', pong, ms: Date.now() - start })
    }catch(err){
        return res.status(500).json({ status: 'error', error: 'Redis not available' })
    }
})

// Cloudflare Images: get direct upload URL
app.post('/api/images/direct-upload', auth('EMPLOYER'), async (req, res) => {
	try{
		if(!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) return res.status(500).json({ error: 'Cloudflare Images not configured' })
		const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v2/direct_upload`
		const r = await fetch(url, {
			method: 'POST',
			headers: { Authorization: `Bearer ${CF_IMAGES_TOKEN}` }
		})
		const data = await r.json()
		if(!data.success) return res.status(500).json({ error: 'Cloudflare error', details: data })
		return res.json({ uploadURL: data.result.uploadURL })
	}catch(err){
		return res.status(500).json({ error: 'Server error' })
	}
})

// Debug: check image access and return proper URLs
app.get('/api/images/debug/:imageId', auth('EMPLOYER'), async (req, res) => {
	try{
		const { imageId } = req.params
		if(!CF_IMAGES_ACCOUNT_HASH) return res.status(500).json({ error: 'CF_IMAGES_ACCOUNT_HASH not configured' })
		
		// Return the proper image URL format
		const imageUrl = `https://imagedelivery.net/${CF_IMAGES_ACCOUNT_HASH}/${imageId}/${CF_IMAGES_VARIANT}`
		
		return res.json({
			imageId,
			accountHash: CF_IMAGES_ACCOUNT_HASH,
			variant: CF_IMAGES_VARIANT,
			imageUrl,
			note: 'Make sure the public variant is configured in Cloudflare Images dashboard'
		})
	}catch(err){
		return res.status(500).json({ error: 'Server error' })
	}
})

// Public: get image info (no auth required for public images)
app.get('/api/images/info/:imageId', async (req, res) => {
	try{
		const { imageId } = req.params
		if(!CF_IMAGES_ACCOUNT_HASH) return res.status(500).json({ error: 'CF_IMAGES_ACCOUNT_HASH not configured' })
		
		// Return the proper image URL format
		const imageUrl = `https://imagedelivery.net/${CF_IMAGES_ACCOUNT_HASH}/${imageId}/${CF_IMAGES_VARIANT}`
		
		return res.json({
			imageId,
			imageUrl,
			status: 'Use this URL to access the image'
		})
	}catch(err){
		return res.status(500).json({ error: 'Server error' })
	}
})

// Employer: create candidate manually
app.post('/api/employer/candidates', auth('EMPLOYER'), async (req, res) => {
	try{
		const { name, phone, region, interest, contract, age, experience, salaryWorker, status, images } = req.body
		if(!name || !phone || !region) return res.status(400).json({ error: 'Missing required fields' })
		
		// Create a dummy vacancy for the candidate if none exists
		let vacancy = await prisma.vacancy.findFirst({ where: { ownerId: req.user.id } })
		if (!vacancy) {
			vacancy = await prisma.vacancy.create({ 
				data: { 
					title: 'Candidat manual adăugat', 
					text: 'Candidat adăugat manual de angajator', 
					region: region, 
					salary: '', 
					ownerId: req.user.id 
				} 
			})
		}
		
		const data = { 
			name, 
			phone, 
			region, 
			interest: interest || null,
			offerId: vacancy.id,
			status: status || 'new'
		}
		if (typeof contract === 'string' || contract === null) data.Contract = contract
		if (typeof age === 'number' || age === null) data.Age = age
		if (typeof experience === 'string' || experience === null) data.Experience = experience
		if (typeof salaryWorker === 'string' || salaryWorker === null) data.SalaryWorker = salaryWorker
		if (Array.isArray(images)) {
			try {
				data.images = JSON.stringify(images)
			}catch{}
		}
		
		const candidate = await prisma.application.create({ data, include: { offer: true } })
		return res.json(candidate)
	}catch(err){
		return res.status(500).json({ error: 'Server error' })
	}
})

const PORT = process.env.PORT || 3010
const server = app.listen(PORT, () => console.log(`birjatg server on :${PORT}`))

async function gracefulShutdown(){
    console.log('Shutting down...')
    try{ await redis.quit() }catch{}
    try{ await prisma.$disconnect() }catch{}
    server.close(() => process.exit(0))
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

