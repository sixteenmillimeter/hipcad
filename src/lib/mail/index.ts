'use strict'

interface MailOptions {
	log? : any;
	provider? : string;
	from? : string;
	SPARKPOST_FROM? : string;
	SPARKPOST_API_KEY? : string;
	GMAIL_USER? : string;
	GMAIL_PASSWORD? : string;
	SMTP_FROM? : string;
	SMTP_USER? : string;
	SMTP_PASSWORD? : string;
	SMTP_PORT? : number;
	SMTP_HOST? : string;
}

/** @module mail */
/** Mail module for Sparkpost, SES and nodemailer... */

/** Class representing a federated email client for use with SaaS providers */
export default class Mail {
	private _client : any
	public provider : string
	public from : string
	public SparkPost : any //Apache License
	public aws : any
	public nodemailer : any
	public log : any = {
		info : (args : any) => { this.log.log(...args) },
		warn : (args : any) => { this.log.warn(...args) },
		error : (args : any) => { this.log.error(...args) }
	};
	/**
	 *
	 * Initialize mail client and require necessary modules
	 * Options may contain, all uppercase keys can and should be defined in environment variables:
	 * * `provider` - sparkpost, nodemailer or ses
	 * * `from` - (optional) Sending email address
	 * * `SPARKPOST_FROM` - (optional) Sending email address for SparkPost
	 * * `SPARKPOST_API_API_KEY`- (optional) API key for SparkPost
	 *
	 * @constructor
	 * @param  {Object} options Configuration options
	 */
	constructor (options : MailOptions = {}) {
		if (options.log){
			this.log = options.log;
		}

		if (typeof process.env.SPARKPOST_API_KEY !== 'undefined') {
			this.SparkPost = require('sparkpost')
			this._client = this._sparkpostInit(options)
		} else if (typeof process.env.GMAIL_USER !== 'undefined') {
			this.nodemailer = require('nodemailer') 
			this._client = this._gmailInit(options)
		} else if (typeof process.env.SMTP_USER !== 'undefined') {
			this.nodemailer = require('nodemailer') 
			this._client = this._smtpInit(options)
		} else if (typeof process.env.SES_ACCESS_KEY_ID !== 'undefined') {
			this.aws = require('aws-sdk')
			this._client = this._sesInit(options)
		} else {
			this.log.error(new Error('No email provider defined').toString())
		}
	}
	/**
	 * Send email through the configured third-party transactional email service
	 * 
	 * @param  {String} to  addressee's email address
	 * @param  {String} subject  subject of the email
	 * @param  {String} body  email's contents, supports HTML
	 * @param  {String} from (optional) sender's email address, overrides one set in config
	 * 
	 * @returns {Function} Promise
	 */
	public async send (to : string[] = null, subject : string = null, body : string = null, from : string = null) {
		return new Promise( (fulfill, reject) => {
			let config = {}

			if (to === null) {
				return reject('No addressee')
			}
			if (subject === null) {
				return reject('No subject')
			}
			if (body === null) {
				return reject('No content')
			}
		
			if (this.provider === 'sparkpost') {
				config = this._sparkpostConfig(to, subject, body, from)
				this._client.transmissions.send(config)
					.then((data : any) => {
						return fulfill(data)
					})
					.catch((err : Error) => {
						return reject(err)
					})
			} else if (this.provider === 'ses') {
				config = this._sesConfig(to, subject, body, from)
				this._client.sendEmail(config, (err : Error, data : any) => {
					if (err) {
						return reject(err)
					}
					fulfill(data)
				})
			} else if (this.provider === 'gmail') {
				config = this._gmailConfig(to, subject, body)
				this._client.sendMail(config, (err : Error, data : any) => {
					if (err) {
						return reject(err)
					}
					fulfill(data)
				})
			} else if (this.provider === 'smtp') {
				config = this._smtpConfig(to, subject, body)
				this._client.sendMail(config, (err : Error, data : any) => {
					if (err) {
						return reject(err)
					}
					fulfill(data)
				})
			} else {
				return reject('Provider is not supported')
			}
		})
	}
	/**
	 * Send email through the configured third-party transactional email service (with callback)
	 * 
	 * @param  {String} to  addressee's email address
	 * @param  {String} subject  subject of the email
	 * @param  {String} body  email's contents, supports HTML
	 * @param  {Function} callback
	 * @param  {String} from (optional) sender's email address, overrides one set in config
	 * 
	 */
	public sendAsync (to : string[] = null, subject : string = null, body : string = null, callback : Function = () => {}, from : string = null) {
		let config = {}
		if (to === null) {
			return callback('No addressee')
		}
		if (subject === null) {
			return callback('No subject')
		}
		if (body === null) {
			return callback('No content')
		}
		if (this.provider === 'sparkpost') {
			config = this._sparkpostConfig(to, subject, body, from)
			this._client.transmissions.send(config)
				.then((data : any) => {
					callback(null, data)
				})
				.catch((err : Error) => {
					callback(err)
				})
		} else if (this.provider === 'ses') {
			config = this._sesConfig(to, subject, body, from)
			this._client.sendEmail(config, callback)
		} else if (this.provider === 'nodemailer') {
			config = this._gmailConfig(to, subject, body, from)
			this._client.sendMail(config, callback)
		} if (this.provider === 'smtp') {
			config = this._smtpConfig(to, subject, body)
			this._client.sendMail(config, callback)
		} else {
			return callback('Provider is not supported')
		}
	}

	/* SPARKPOST */

	/**
	 * Initialize the SparkPost client from a configuration object
	 * 
	 * @param  {Object} options configuration for the SparkPost service
	 * 
	 * @return {Object} SparkPost client
	 */
	private _sparkpostInit (options : MailOptions) {
		//sparkpost configuration
		let API_KEY = ''

		this.provider = 'sparkpost'
		if (typeof options.from !== 'undefined') {
			this.from = options.from
		} else if (typeof options.SPARKPOST_FROM !=='undefined') {
			this.from = options.SPARKPOST_FROM
		} else if (typeof process.env.SPARKPOST_FROM !== 'undefined') {
			this.from = process.env.SPARKPOST_FROM
		} else {
			this.from = 'Unknown'
		}

		if (typeof options.SPARKPOST_API_KEY !== 'undefined'){
			API_KEY = options.SPARKPOST_API_KEY
		} else  if (typeof process.env.SPARKPOST_API_KEY !== 'undefined') {
			API_KEY = process.env.SPARKPOST_API_KEY
		} else {
			return this.log.error(new Error('No SPARKPOST_API_KEY found').toString())
		}

		this.log.info(`Using mail provider SparkPost`);
		return new this.SparkPost(API_KEY)
	}
	/**
	 * Create the options object for sending with SparkPost client
	 * 
	 * @param  {String} to  addressee's email address
	 * @param  {String} subject  subject of the email
	 * @param  {String} body  email's contents, supports HTML
	 * @param  {String} from (optional) sender's email address, overrides one set in config
	 * 
	 * @return {Object} options
	 */
	private _sparkpostConfig (to : string[], subject : string, body : string, from? : string) {
		const config : any = {}
		config.options = {
			open_tracking: false,
			click_tracking: false
		}
		config.content = {
			from : from || this.from,
			subject,
			html : body
		}
		if (typeof to === 'object') {
			config.recipients = []
			for (let t of to) {
				config.recipients.push({ address: t })
			}
		} else if (typeof to === 'string') {
			config.recipients = [{ address : to }]
		}
		return config
	}
	/* AMAZON SES */
	/**
	 * Initialize the Amazon client from a configuration object
	 * 
	 * @param  {Object} options configuration for the SES service
	 * 
	 * @return {Object} Amazon client
	 */
	private _sesInit (options : any) {
		const config : any = {}

		this.provider = 'ses'

		//sslEnabled: false //TODO: Is ssl not allowed by default?

		if (typeof options.from !== 'undefined') {
			this.from = options.from
		} else if (typeof process.env.SES_FROM !== 'undefined') {
			this.from = process.env.SES_FROM
		} else {
			this.from = 'Unknown'
		}

		if (typeof options.SES_ACCESS_KEY_ID !== 'undefined'){
			config.accessKeyId = options.SES_ACCESS_KEY_ID
		} else  if (typeof process.env.SES_ACCESS_KEY_ID !== 'undefined') {
			config.accessKeyId = process.env.SES_ACCESS_KEY_ID
		} else {
			return this.log.error(new Error('No accessKeyId defined for SES process').toString())
		}

		if (typeof options.SES_SECRET_ACCESS_KEY !== 'undefined'){
			config.secretAccessKey = options.SES_SECRET_ACCESS_KEY
		} else  if (typeof process.env.SES_SECRET_ACCESS_KEY !== 'undefined') {
			config.secretAccessKey = process.env.SES_SECRET_ACCESS_KEY
		} else {
			return this.log.error(new Error('No secretAccessKey defined for SES process').toString())
		}

		if (typeof options.SES_REGION !== 'undefined'){
			config.region = options.SES_REGION
		} else  if (typeof process.env.SES_REGION !== 'undefined') {
			config.region = process.env.SES_REGION
		} else {
			//config.region = 'us-east-1' //default to US East 1
			return this.log.error(new Error('No region defined for SES process').toString())
		}

		config.apiVersion = '2010-12-01'

		this.aws.config.update(config)
		this.log.info(`Using mail provider Amazon SES`);
		return new this.aws.SES()
	}
	/**
	 * Create the options object for sending through SES with Amazon client
	 * 
	 * @param  {String} to  addressee's email address
	 * @param  {String} subject  subject of the email
	 * @param  {String} body  email's contents, supports HTML
	 * @param  {String} from (optional) sender's email address, overrides one set in config
	 * 
	 * @return {Object} options
	 */
	private _sesConfig (to : string[], subject : string, body : string, from? : string) {
		const config : any = { 
			Source: from || this.from, 
			Message: {
				Subject : {
					Data: subject
				},
				Body: {
					Text: {
						Data: body,
					}
				}
			}
		}
		if (typeof to === 'object') {
			config.Destination = { ToAddresses: to }
		} else if (typeof to === 'string') {
			config.Destination = { ToAddresses: [to] }
		}
		return config
	}
	/* GMAIL */
	/**
	 * Initialize the Nodemailer client from a configuration object
	 * 
	 * @param  {Object} options configuration for the SES service
	 * 
	 * @return {Object} Nodemailer client
	 */
	private _gmailInit (options : MailOptions) {
		const config : any = {
			service : 'Gmail', //only gmail at the moment
			auth : {
				user : '',
				pass : ''
			}
		}
		this.provider = 'gmail'
		if (typeof options.GMAIL_USER !== 'undefined') {
			this.from = options.GMAIL_USER
			config.auth.user = options.GMAIL_USER
		} else if (typeof process.env.GMAIL_USER !== 'undefined') {
			this.from = process.env.GMAIL_USER
			config.auth.user = process.env.GMAIL_USER
		} else {
			return this.log.error(new Error('No GMAIL_USER found').toString())
		}
		if (typeof options.GMAIL_PASSWORD !== 'undefined'){
			config.auth.pass = options.GMAIL_PASSWORD
		} else  if (typeof process.env.GMAIL_PASSWORD !== 'undefined') {
			config.auth.pass = process.env.GMAIL_PASSWORD
		} else {
			return this.log.error(new Error('No GMAIL_PASSWORD found').toString())
		}
		this.log.info(`Using mail provider Gmail (nodemailer)`);
		return this.nodemailer.createTransport(config)
	}
	/**
	 * Create the options object for sending through Gmail with Nodemailer
	 * 
	 * @param  {String} to  addressee's email address
	 * @param  {String} subject  subject of the email
	 * @param  {String} body  email's contents, supports HTML
	 * @param  {String} from From email
	 * 
	 * @return {Object} options
	 */
	private _gmailConfig (to : string[], subject : string, body : string, from? : string) {
		const config = {
			from : from || this.from,
			to,
			subject,
			html :  body
		}
		return config
	}
	private _smtpInit (options : MailOptions) {
		const config : any = {
		    host: '',
		    port: 587, //default SMTP port
		    secure: false, // true for 465, false for other ports
		    auth: {
		      user: '',
		      pass: '' 
		    }  
		}
		this.provider = 'smtp'
		if (typeof options.from !== 'undefined') {
			this.from = options.from
		} else if (typeof options.SMTP_FROM !=='undefined') {
			this.from = options.SMTP_FROM
		} else if (typeof process.env.SMTP_FROM !== 'undefined') {
			this.from = process.env.SMTP_FROM
		} else {
			this.from = 'Unknown'
		}
		if (typeof options.SMTP_USER !== 'undefined') {
			config.auth.user = options.SMTP_USER
		} else if (typeof process.env.SMTP_USER !== 'undefined') {
			config.auth.user = process.env.SMTP_USER
		} else {
			return this.log.error(new Error('No SMTP_USER found').toString())
		}
		if (typeof options.SMTP_PASSWORD !== 'undefined'){
			config.auth.pass = options.SMTP_PASSWORD
		} else  if (typeof process.env.SMTP_PASSWORD !== 'undefined') {
			config.auth.pass = process.env.SMTP_PASSWORD
		} else {
			return this.log.error(new Error('No SMTP_PASSWORD found').toString())
		}
		if (typeof options.SMTP_HOST !== 'undefined'){
			config.host = options.SMTP_HOST
		} else  if (typeof process.env.SMTP_HOST !== 'undefined') {
			config.host = process.env.SMTP_HOST
		} else {
			return this.log.error(new Error('No SMTP_HOST found').toString())
		}
		if (typeof options.SMTP_PORT !== 'undefined') {
			config.port = options.SMTP_PORT
		} else if (typeof process.env.SMTP_PORT !== 'undefined') {
			config.port = parseInt(process.env.SMTP_PORT)
		}

		if (config.port === 465) {
			config.secure = true
		}

		this.log.info(`Using mail provider SMTP @ ${config.host}`);

		return this.nodemailer.createTransport(config);
	}
	private _smtpConfig (to : string[], subject : string, body : string, from? : string) {
		const config = {
			from : from || this.from,
			to,
			subject,
			html :  body
		}
		return config
	}
}

module.exports = Mail
