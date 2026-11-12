/* Which things each stage holds; art-cozy.js spaces them out on the stage. A slot is [x, y, kind, holder]: x and y are measured from the stage's centre,
   kind is 'high' (on top of holder, reached by jumping) or 'hidden' (under holder); no kind means on the ground.
   Words fill slots in the order they appear in data.js, so any sound fits any scenario. */
window.ArticulationScenes = {
  islands: {
    travel: 'water', gap: 1330, cy: 820, sky: '#7fd3ea',
    props: ['ripple', 'plank', 'cloud', 'butterfly', 'bird', 'blades', 'flame'],
    stages: {
      first: {
        ride: 'boat',
        slots: [[-240, 165, 'hidden', 'hay'], [-330, -200], [120, -330], [350, -70], [40, 360, 'high', 'tree'], [350, 90, 'hidden', 'bush'], [-120, -260, 'high', 'tree'], [-150, 40], [-130, 250, 'hidden', 'hay'], [170, -60]],
        empties: [['bush', -300, 10], ['hay', -20, -120]],
        decor: [['windmill', -430, -330, 1.5], ['cottage', -440, 340, 1.2], ['tree', 190, -470, .85], ['tree', 235, 455, .85], ['fence', -240, 430, .7], ['sunflower', 280, -220, .62], ['sunflower', 250, -270, .5], ['sunflower', -200, -90, .55], ['hen', -40, 340, .32], ['hen', 30, -30, .3], ['sheep', 240, 215, .5], ['flower', -60, -380], ['flower', 300, 20], ['flower', -260, 90], ['flower', 20, 280], ['flower', 420, 10], ['flower', -400, -60]],
      },
      middle: {
        ride: 'balloon',
        slots: [[-440, -260, 'hidden', 'leaves'], [-300, 250, 'hidden', 'stump'], [300, 240, 'hidden', 'rock'], [-420, -60], [470, -230], [90, -170], [-150, -330, 'high', 'pine'], [520, 60], [-230, -30], [250, -340, 'high', 'pine']],
        empties: [['leaves', -450, 200], ['rock', 440, 280]],
        decor: [['pine', -600, -150, .9], ['pine', -590, 250, .85], ['pine', -420, -420, .85], ['pine', -380, 420, .9], ['pine', 610, 170, .85], ['pine', 590, -160, .9], ['pine', 420, -440, .85], ['pine', 330, 475, .9], ['tent', -130, 170, 1.1], ['firelogs', 30, 120, .55], ['log', 150, 190, .7], ['bigmush', -300, -150, .5], ['bigmush', 210, 60, .55], ['bigmush', 330, -110, .4]],
      },
      last: {
        slots: [[-400, -110, 'high', 'palm'], [-230, 90], [-60, -180, 'hidden', 'sand'], [180, -370], [40, -30], [290, -170], [250, 100, 'hidden', 'sand'], [120, 250, 'hidden', 'bucket'], [250, 390, 'high', 'palm'], [-130, 270]],
        empties: [['bucket', -350, 190], ['sand', 90, -240]],
        decor: [['lighthouse', 335, -465, 1.6], ['palm', -520, 130, .95], ['palm', -500, -175, .9], ['palm', -40, 430, .8], ['sandcastle', -10, 150, .8], ['crab', 60, 365, .36], ['crab', 130, -120, .3], ['cactus', 340, -50, .7], ['cactus', 370, 210, .55], ['hut', 345, 500, .85], ['shell', -260, -40], ['shell', 150, 70], ['shell', -20, -320], ['shell', 330, -300], ['shell', -300, 260]],
      },
    },
  },
  house: {
    travel: 'door', gap: 0, cy: 860, sky: '#bfe6f7',
    props: ['door-back', 'door-front', 'lock', 'cloud'],
    stages: {
      first: {
        ride: 'door',
        slots: [[-500, 60, 'hidden', 'basket'], [-280, -120], [-60, 20], [190, -130], [-400, -236, 'high', 'shelf'], [330, 130, 'hidden', 'pillow'], [330, -236, 'high', 'shelf'], [90, 180], [-220, 170, 'hidden', 'box'], [500, 40]],
        empties: [['pillow', -470, 200], ['box', 290, -20]],
        decor: [['sofa', -30, -236, 1.35], ['floorlamp', 165, -240, 1.05], ['houseplant', -575, -236, .85], ['armchair', -200, -238, .8], ['cat', 120, 225, .4]],
      },
      middle: {
        ride: 'door',
        slots: [[-470, 170, 'hidden', 'box'], [-300, 40], [-60, -130], [170, 40], [-340, -236, 'high', 'fridge'], [330, 170, 'hidden', 'basket'], [300, -236, 'high', 'cupboard'], [30, 190], [-170, -60, 'hidden', 'box'], [500, -10]],
        empties: [['basket', -290, 195], ['box', 200, -120]],
        decor: [['counter', -60, -236, 1.35], ['stove', 130, -238, .95]],
      },
      last: {
        slots: [[-470, 150, 'hidden', 'pillow'], [-250, -50], [-40, -100], [220, 30], [-270, -236, 'high', 'wardrobe'], [360, 170, 'hidden', 'basket'], [550, -236, 'high', 'shelf'], [40, 190], [-200, 180, 'hidden', 'box'], [470, 20]],
        empties: [['box', 230, -130], ['pillow', -430, -30]],
        decor: [['bed', 70, -220, 1.5], ['nightstand', 290, -236, .8], ['toychest', 415, -236, .8], ['cat', -60, 225, .4]],
      },
    },
  },
  street: {
    travel: 'road', gap: 900, cy: 860, sky: '#bfe6f7',
    props: ['cloud', 'car', 'busstop', 'taxisign', 'tree'],
    stages: {
      first: {
        ride: 'bus',
        slots: [[-520, 60, 'hidden', 'crate'], [-340, -110], [-100, 30], [170, -120], [-470, -200, 'high', 'streetlamp'], [330, 110, 'hidden', 'bin'], [310, -200, 'high', 'streetlamp'], [60, 170], [-240, 170, 'hidden', 'cone'], [500, -40]],
        empties: [['cone', -30, -130], ['crate', 470, 185]],
        decor: [['fruitstand', -180, -205, .95], ['hydrant', 60, -215, .45], ['flowerbox', 470, -215, .55], ['flowerbox', -610, -210, .5]],
      },
      middle: {
        ride: 'taxi',
        slots: [[-520, 100, 'hidden', 'bin'], [-330, -60], [-120, 60], [160, -100], [-440, -190, 'high', 'tree'], [320, 120, 'hidden', 'crate'], [290, -190, 'high', 'tree'], [80, 180], [-230, 180, 'hidden', 'cone'], [510, 10]],
        empties: [['crate', -20, -120], ['bin', 490, 190]],
        decor: [['bench', -110, -210, .85], ['fountain', 90, -195, .95], ['swing', 520, -210, 1], ['bench', -600, -205, .7]],
      },
      last: {
        slots: [[-500, 90, 'hidden', 'cone'], [-310, -100], [-90, 40], [190, -90], [-420, -200, 'high', 'streetlamp'], [340, 130, 'hidden', 'bin'], [420, -200, 'high', 'streetlamp'], [70, 180], [-250, 180, 'hidden', 'crate'], [520, 20]],
        empties: [['bin', 50, -125], ['cone', 480, 190]],
        decor: [['slide', -170, -205, 1.05], ['flowerbox', 230, -212, .5], ['trafficlight', 590, -205, .9]],
      },
    },
  },
};
