/* The one place the game and screens ask for art. Drawings live in the art-*.js files; art-cozy.js gives them the approved look. */
window.ArticulationArt = (() => {
  const { svg, uri, words, shapes, props } = window.ArticulationKit, Cozy = window.ArticulationCozy;
  return {
    uri,
    wordSVG: key => Cozy.drawn(Cozy.skin(words[key]), 320),
    objectURI: key => uri(Cozy.plain(Cozy.skin(words[key]), 320)),
    shapeURI: key => uri(svg(shapes[key] || words[key], 320, 320)),
    decoURI: key => uri(Cozy.plain(Cozy.skin(props[key]), 240)),
    decoAt: (key, size) => Cozy.drawn(Cozy.skin(props[key]), size),
    hasProp: key => key in props,
    propKeys: () => Object.keys(props),
    character: kind => Cozy.characterParts(kind),
    portrait: kind => uri(Cozy.portrait(kind)),
    rideIcon: kind => uri(Cozy.plain(Cozy.skin(['back', 'front'].map(part => props[`${kind}-${part}`] || '').join('') || props[kind]), 240)),
    door: Cozy.doorSVG,
    stage: Cozy.stageSVG,
    layout: Cozy.layout,
    background: Cozy.backgroundOf,
  };
})();
