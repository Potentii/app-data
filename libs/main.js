const fs      = require('fs');
const fs_prom = require('fs').promises;
const util    = require('util');
const path    = require('path');
const mkdirp  = require('mkdirp');

if(!fs || !fs.writeFile || !fs.readFile || !fs.access || !fs.unlink)
	throw new Error(`@potentii/app-data: 'fs' module could not be found`);

const writeFileAsync = fs_prom ? fs_prom.writeFile : util.promisify(fs.writeFile);
const readFileAsync  = fs_prom ? fs_prom.readFile  : util.promisify(fs.readFile);
const accessAsync    = fs_prom ? fs_prom.access    : util.promisify(fs.access);
const unlinkAsync    = fs_prom ? fs_prom.unlink    : util.promisify(fs.unlink);
const mkdirpAsync    =                               util.promisify(mkdirp);


const cache = new Map();

let in_memory_cache_enabled = false;
let app_name = null;


function getCacheFile(key){
	return path.join(getCacheDir(), './' + key + '.json')
}

function getCacheDir(){
	if(!app_name)
		throw new Error('Cannot get the app cache folder: The application name was not set');
	return path.join(getUserAppDataDirectory(), './' + app_name, './data');
}

function getUserAppDataDirectory(){
	return process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + 'Library/Preferences' : process.env.HOME + "/.local/share");
}




function enableInMemoryCache(){
	if(!in_memory_cache_enabled){
		cache.clear();
		in_memory_cache_enabled = true;
	}
}


function disableInMemoryCache(){
	if(in_memory_cache_enabled){
		cache.clear();
		in_memory_cache_enabled = false;
	}
}


function setAppName(name){
	app_name = name;
}


async function write(key, content){
	if(!app_name)
		throw new Error(`Cannot write on cache: Application name not set`);

	const file_path = getCacheFile(key);

	if(content === null || content === undefined){
		await remove(key);
	} else{
		const data_to_save = content;
		await mkdirpAsync(getCacheDir());
		await writeFileAsync(file_path, data_to_save, 'utf8');

		if(in_memory_cache_enabled)
			cache.set(key, data_to_save);
	}
}


async function remove(key){
	if(!app_name)
		throw new Error(`Cannot remove data from cache: Application name not set`);

	const file_path = getCacheFile(key);

	try{
		await accessAsync(file_path);
		await unlinkAsync(file_path);
		if(in_memory_cache_enabled)
			cache.delete(key);
	} catch(err){
		if(err.code !== 'ENOENT')
			throw err;
	}
}



/**
 *
 * @param {String} key The cache name
 * @param {Object} obj The object to be saved on cache
 * @return {Promise<void>}
 */
async function save(key, obj){
	if(obj === null || obj === undefined)
		await remove(key);
	else
		await write(key, JSON.stringify(obj));
}

async function set(key, obj){
	return await save(key, obj);
}



async function read(key){
	if(!app_name)
		throw new Error(`Cannot read from cache: Application name not set`);

	if(in_memory_cache_enabled && cache.has(key))
		return cache.get(key);

	const file_path = getCacheFile(key);

	try{
		await accessAsync(file_path);
		const str = await readFileAsync(file_path, 'utf8');
		return (!!str)
			? str.toString()
			: null;
	} catch(err){
		if(err.code === 'ENOENT')
			return null;
		else
			throw err;
	}
}



/**
 *
 * @param {String} key The cache name
 * @return {Promise<Object>}
 */
async function get(key){
	const content = await read(key);
	return (!!content)
		? JSON.parse(content)
		: null;
}



/**
 *
 * @param {String} key The cache name
 * @return {Promise<Array<*>>}
 */
async function getArray(key){
	const array = (await get(key)) || [];
	if(!Array.isArray(array))
		throw new TypeError(`Cache could not be read: Expected an array, got "${typeof array}" on cache named "${key}"`);

	return array;
}



/**
 *
 * @param {String} key The cache name
 * @param {*} item The item to be added in the array
 * @return {Promise<void>}
 */
async function addToArray(key, item){
	const array = await getArray(key);

	array.push(item);

	await save(key, array);
}



module.exports = {
	enableInMemoryCache,
	disableInMemoryCache,
	setAppName,
	remove,
	write,
	read,
	set,
	save,
	get,
	getArray,
	addToArray
};
