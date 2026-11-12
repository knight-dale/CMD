window.PROJECTS = [
  {
    t: 'Planetary Gearbox 12 to 1',
    c: 'Mechanical Design',
    s: 2,
    g: ['SolidWorks', 'SLA Resin', 'FEA Validated'],
    p: ['Tolerance: 0.05 mm', 'Max Load: 450 N'],
    d: 'Two stage planetary train with a parametric carrier. Contact stress on the planet pins drove a fillet redesign before printing.'
  },
  {
    t: 'Cam Driven Pick Gripper',
    c: 'Robotics & Automation',
    s: 1,
    g: ['Fusion 360', 'FDM PLA+'],
    p: ['Stroke: 42 mm', 'Grip: 38 N'],
    d: 'Single servo gripper whose cam profile gives a near constant grip force across the stroke.'
  },
  {
    t: 'Passive Heat Sink Enclosure',
    c: 'Consumer Hardware',
    s: 2,
    g: ['Inventor', 'ANSYS', 'FEA Validated'],
    p: ['Delta T: 18 deg C', 'Rating: IP54'],
    d: 'Fin geometry tuned in thermal simulation, then soak tested against a 12 W heater block.'
  },
  {
    t: 'Drill Press Alignment Jig',
    c: 'Tooling & Jigs',
    s: 1,
    g: ['SolidWorks', 'FDM PETG'],
    p: ['Tolerance: 0.1 mm', 'Cycle: 6 s'],
    d: 'Quick clamp jig that repeats hole position across a batch of 200 panels.'
  },
  {
    t: 'Four Bar Linkage Walker',
    c: 'Robotics & Automation',
    s: 0,
    g: ['Fusion 360'],
    p: ['DOF: 1', 'Mass: 0.8 kg'],
    d: 'Motion study of a single motor walking mechanism, optimising foot trajectory before any print.'
  },
  {
    t: 'Bike Light Mount',
    c: 'Consumer Hardware',
    s: 1,
    g: ['Fusion 360', 'Bambu Studio', 'FDM PETG'],
    p: ['Clamp: 22 to 35 mm', 'Mass: 24 g'],
    d: 'Tool free clamp with a flexure latch, printed on its side for hinge strength.'
  },
  {
    t: 'Pneumatic Actuator Manifold',
    c: 'Mechanical Design',
    s: 0,
    g: ['Inventor'],
    p: ['Pressure: 6 bar', 'Ports: 8'],
    d: 'Eight port manifold with internal channels sized for equal flow to each cylinder.'
  },
  {
    t: 'Composite Layup Fixture',
    c: 'Tooling & Jigs',
    s: 2,
    g: ['SolidWorks', 'ANSYS', 'Cura'],
    p: ['Flatness: 0.08 mm', 'Temp: 120 deg C'],
    d: 'Printed mould plate verified for flatness after repeated oven cycles.'
  },
  {
    t: 'Harmonic Drive Wrist',
    c: 'Robotics & Automation',
    s: 2,
    g: ['SolidWorks', 'ANSYS', 'SLA Resin'],
    p: ['Ratio: 50 to 1', 'Backlash: under 0.1 deg'],
    d: 'Compact wrist joint using a flexspline cup, characterised on a dynamometer.'
  },
  {
    t: 'Folding Stand Hinge',
    c: 'Consumer Hardware',
    s: 1,
    g: ['Fusion 360', 'SLA Resin'],
    p: ['Life: 5000 cycles', 'Angle: 0 to 110 deg'],
    d: 'Friction hinge that holds any angle without a spring, cycle tested to 5000 openings.'
  },
  {
    t: 'Wire Harness Test Board',
    c: 'Tooling & Jigs',
    s: 1,
    g: ['Inventor', 'FDM PLA+'],
    p: ['Pins: 48', 'Setup: 90 s'],
    d: 'Pogo pin fixture that checks a 48 way harness for continuity in one press.'
  },
  {
    t: 'Topology Optimised Bracket',
    c: 'Mechanical Design',
    s: 2,
    g: ['ANSYS', 'Fusion 360', 'Bambu Studio', 'FEA Validated'],
    p: ['Mass: 41 percent cut', 'Max Load: 1.2 kN'],
    d: 'Load path bracket grown from a design space, then smoothed and pull tested to failure.'
  }
];
