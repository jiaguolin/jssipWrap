'use strict';

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FILES = require('./sounds.json');

var logger = new _Logger2.default('audioPlayer');

var SOUNDS = new Map([['ringback', { audio: new Audio(FILES['ringback']), volume: 1.0 }], ['ringing', { audio: new Audio(FILES['ringing']), volume: 1.0 }], ['answered', { audio: new Audio(FILES['answered']), volume: 1.0 }], ['rejected', { audio: new Audio(FILES['rejected']), volume: 0.5 }]]);

var initialized = false;

module.exports = {
	/**
  * Play all the sounds so they will play in mobile browsers at any time
  */
	initialize: function initialize() {
		if (initialized) return;

		logger.debug('initialize()');

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = SOUNDS.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var sound = _step.value;

				sound.audio.volume = 0;

				try {
					sound.audio.play();
				} catch (error) {}
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		initialized = true;
	},


	/**
  * Play a sound
  * @param {String} name - Sound name
  * @param {[Float]} relativeVolume - Relative volume (0.0 - 1.0)
  */
	play: function play(name, relativeVolume) {
		this.initialize();

		if (typeof relativeVolume !== 'number') relativeVolume = 1.0;

		logger.debug('play() [name:%s, relativeVolume:%s]', name, relativeVolume);

		var sound = SOUNDS.get(name);

		if (!sound) throw new Error('unknown sound name "' + name + '"');

		try {
			sound.audio.pause();
			sound.audio.currentTime = 0.0;
			sound.audio.volume = (sound.volume || 1.0) * relativeVolume;
			sound.audio.play();
		} catch (error) {
			logger.warn('play() | error: %o', error);
		}
	},
	stop: function stop(name) {
		logger.debug('stop() [name:%s]', name);

		var sound = SOUNDS.get(name);

		if (!sound) throw new Error('unknown sound name "' + name + '"');

		sound.audio.pause();
		sound.audio.currentTime = 0.0;
	}
};