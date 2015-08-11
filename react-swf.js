/*! react-swf v0.12.2 | @syranide | MIT license */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['react'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('react'));
  } else {
    root.ReactSWF = factory(root.React);
  }
}(this, function(React) {
  'use strict';

  var mimeTypeFP = 'application/x-shockwave-flash';

  /*
    flashVars = {key: string} or "key=value&..."

    allowFullScreen = true, false*
    allowNetworking = all*, internal, none
    allowScriptAccess = always, sameDomain, never

    align = l, t, r
    base = url
    bgcolor = #RRGGBB
    fullScreenAspectRatio = portrait, landscape
    loop = true*, false
    menu = true*, false
    play = true*, false
    quality = low, autolow, autohigh, medium, high, best
    salign = l, t, r, tl, tr
    scale = default*, noborder, exactfit, noscale
    seamlessTabbing = true*, false
    wmode = window*, direct, opaque, transparent, gpu
  */

  var supportedFPParamNames = {
    flashVars: 'flashvars',

    allowFullScreen: 'allowfullscreen',
    allowNetworking: 'allownetworking',
    allowScriptAccess: 'allowscriptaccess',

    align: 'align',
    base: 'base',
    bgcolor: 'bgcolor',
    fullScreenAspectRatio: 'fullscreenaspectratio',
    loop: 'loop',
    menu: 'menu',
    play: 'play',
    quality: 'quality',
    salign: 'salign',
    scale: 'scale',
    seamlessTabbing: 'seamlesstabbing',
    wmode: 'wmode'
  };

  var booleanFPParams = {
    allowFullScreen: true,
    loop: true,
    menu: true,
    play: true,
    seamlessTabbing: true
  };


  var ENCODE_FLASH_VARS_REGEX = /[\r%&+=]/g;
  var ENCODE_FLASH_VARS_LOOKUP = {
    '\r': '%0D',
    '%': '%25',
    '&': '%26',
    '+': '%2B',
    '=': '%3D'
  };

  function encodeFlashVarsStringReplacer(match) {
    return ENCODE_FLASH_VARS_LOOKUP[match];
  }

  function encodeFlashVarsString(string) {
    return ('' + string).replace(
      ENCODE_FLASH_VARS_REGEX,
      encodeFlashVarsStringReplacer
    );
  }

  function encodeFlashVarsObject(object) {
    // Push to array; faster and scales better than string concat.
    var output = [];

    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        var value = object[key];

        if (value != null) {
          output.push(
            encodeFlashVarsString(key) + '=' + encodeFlashVarsString(value)
          );
        }
      }
    }

    return output.join('&');
  }


  var memoizedFPVersion;

  function getMemoizedFPVersion() {
    if (memoizedFPVersion === undefined) {
      memoizedFPVersion = getFPVersion();
    }

    return memoizedFPVersion;
  }

  /**
   * Detect installed Flash Player version. Cached.
   *
   * @return {?string} 'X.Y.Z'-version or null.
   */
  function getFPVersion() {
    if (typeof navigator !== 'undefined') {
      var navFPPlugin = (
        navigator.plugins &&
        navigator.plugins['Shockwave Flash']
      );
      var navFPMimeType = (
        navigator.mimeTypes &&
        navigator.mimeTypes[mimeTypeFP]
      );

      if (navFPPlugin && navFPMimeType && navFPMimeType.enabledPlugin) {
        try {
          return (
            navFPPlugin
              .description
              .match(/(\d+)\.(\d+) r(\d+)/)
              .slice(1)
              .join('.')
          );
        } catch (e) {
        }
      }
    }

    // ActiveXObject-fallback for IE8-10
    if (typeof ActiveXObject !== 'undefined') {
      try {
        return (
          new ActiveXObject('ShockwaveFlash.ShockwaveFlash')
            .GetVariable('$version')
            .match(/(\d+),(\d+),(\d+)/)
            .slice(1)
            .join('.')
        );
      } catch (e) {
      }
    }

    return null;
  }

  /**
   * Detect if installed Flash Player meets version requirement.
   *
   * @param {string} versionString 'X.Y.Z', 'X.Y' or 'X'.
   * @return {boolean} true if supported.
   */
  function isFPVersionSupported(versionString) {
    var installedString = getMemoizedFPVersion();

    if (installedString == null) {
      return false;
    }

    var installedFields = installedString.split('.');
    var requiredFields = versionString.split('.');

    for (var i = 0; i < 3; i++) {
      var installedNumber = +installedFields[i];
      var requiredNumber = +(requiredFields[i] || 0);

      if (installedNumber !== requiredNumber) {
        return installedNumber > requiredNumber;
      }
    }

    return true;
  }


  /** @constructor */
  function ReactSWF(props) {
    React.Component.call(this, props);

    var that = this;
    this._refCallback = function(c) {
      that._node = c;
    };

    // The only way to change Flash parameters or reload the movie is to update
    // the key of the ReactSWF element. This unmounts the previous instance and
    // reloads the movie. Store initial values to keep the DOM consistent.

    var params = {
      // IE8 requires the `movie` parameter.
      'movie': props.src
    };

    for (var key in supportedFPParamNames) {
      if (supportedFPParamNames.hasOwnProperty(key) &&
          props.hasOwnProperty(key)) {
        var value = props[key];

        if (value != null) {
          var name = supportedFPParamNames[key];

          if (name === 'flashvars' && typeof value === 'object') {
            value = encodeFlashVarsObject(value);
          } else if (booleanFPParams.hasOwnProperty(key)) {
            // Force boolean parameter arguments to be boolean.
            value = !!value;
          }

          params[name] = '' + value;
        }
      }
    }

    this._node = null;
    this.state = {
      src: props.src,
      params: params
    };
  }

  ReactSWF.getFPVersion = getMemoizedFPVersion;
  ReactSWF.isFPVersionSupported = isFPVersionSupported;

  ReactSWF.propTypes = {
    src: React.PropTypes.string.isRequired,

    flashVars: React.PropTypes.oneOfType([
      React.PropTypes.object, React.PropTypes.string
    ]),

    allowFullScreen: React.PropTypes.bool,
    allowNetworking: React.PropTypes.oneOf([
      'all', 'internal', 'none'
    ]),
    allowScriptAccess: React.PropTypes.oneOf([
      'always', 'sameDomain', 'never'
    ]),

    align: React.PropTypes.oneOf([
      'l', 't', 'r'
    ]),
    base: React.PropTypes.string,
    bgcolor: React.PropTypes.string,
    fullScreenAspectRatio: React.PropTypes.oneOf([
      'portrait', 'landscape'
    ]),
    loop: React.PropTypes.bool,
    menu: React.PropTypes.bool,
    play: React.PropTypes.bool,
    quality: React.PropTypes.oneOf([
      'low', 'autolow', 'autohigh', 'medium', 'high', 'best'
    ]),
    salign: React.PropTypes.oneOf([
      'l', 't', 'r', 'tl', 'tr'
    ]),
    scale: React.PropTypes.oneOf([
      'default', 'noborder', 'exactfit', 'noscale'
    ]),
    seamlessTabbing: React.PropTypes.bool,
    wmode: React.PropTypes.oneOf([
      'window', 'direct', 'opaque', 'transparent', 'gpu'
    ])
  };

  ReactSWF.prototype = Object.create(React.Component.prototype);
  ReactSWF.prototype.constructor = ReactSWF;

  ReactSWF.prototype.getFPDOMNode = function() {
    return this._node;
  };

  ReactSWF.prototype.shouldComponentUpdate = function(nextProps) {
    var prevProps = this.props;

    for (var key in prevProps) {
      // Ignore all Flash parameter props
      if (prevProps.hasOwnProperty(key) &&
          !supportedFPParamNames.hasOwnProperty(key) &&
          (!nextProps.hasOwnProperty(key) ||
           !Object.is(prevProps[key], nextProps[key]))) {
        return true;
      }
    }

    for (var key in nextProps) {
      if (nextProps.hasOwnProperty(key) &&
          !supportedFPParamNames.hasOwnProperty(key) &&
          !prevProps.hasOwnProperty(key)) {
        return true;
      }
    }

    return false;
  };

  ReactSWF.prototype.componentWillUnmount = function() {
    // IE8 leaks nodes if AS3 `ExternalInterface.addCallback`-functions remain.
    if (document.documentMode < 9) {
      var node = this._node;

      // Node-methods are not enumerable in IE8, but properties are.
      for (var key in node) {
        if (typeof node[key] === 'function') {
          node[key] = null;
        }
      }
    }
  };

  ReactSWF.prototype.render = function() {
    var props = this.props;
    var state = this.state;

    // AS3 `ExternalInterface.addCallback` requires a unique node ID in IE8-10.
    // There is however no isolated way to play nice with server-rendering, so
    // we must leave it up to the user.

    var objectProps = {
      ref: this._refCallback,
      children: [],
      type: mimeTypeFP,
      data: state.src,
      // Discard `props.src`
      src: null
    };

    for (var key in props) {
      // Ignore props that are Flash parameters or managed by this component.
      if (props.hasOwnProperty(key) &&
          !supportedFPParamNames.hasOwnProperty(key) &&
          !objectProps.hasOwnProperty(key)) {
        objectProps[key] = props[key];
      }
    }

    var objectChildren = objectProps.children;

    for (var name in state.params) {
      objectChildren.push(
        React.createElement('param', {
          key: name,
          name: name,
          value: state.params[name]
        })
      );
    }

    // Push `props.children` to the end of the children, React will generate a
    // key warning if there are multiple children. This is preferable for now.
    if (props.children != null) {
      objectChildren.push(props.children);
    }

    return React.createElement('object', objectProps);
  };

  return ReactSWF;
}));
