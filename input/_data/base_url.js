require('dotenv').config();

module.exports = async function () {
	return process.env.BASE_URL;
};