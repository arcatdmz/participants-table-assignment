// input
const numRooms = 3;
const participantIds = [
  "src1061",
  "src1029",
  "src1036",
  "src1050",
  "src1048",
  "src1049",
  "src1051",
  "src1017",
  "src1062",
  "src1025",
  "src1008",
];
const shuffles = 6;

// class def
class Room {
  public static numRooms: number = 0;
  id: number;
  assignments: Set<Participant>[];
  constructor() {
    this.id = ++Room.numRooms;
    this.assignments = [];
  }
  addAssignment(participants: Set<Participant>) {
    this.assignments.push(participants);
    for (const p of participants) {
      p.assignments.push(this);
      for (const p_ of participants) {
        p.met.add(p_);
      }
    }
  }
  print() {
    console.log(`room ${this.id} assignments:`);
    for (const assignment of this.assignments) {
      console.log(
        JSON.stringify(
          [...assignment].map((p) => p.toString()),
          null,
          ""
        )
      );
    }
  }
}

class Participant {
  assignments: Room[];
  met: Set<Participant>;
  constructor(public id: string) {
    this.assignments = [];
    this.met = new Set([this]);
  }
  unmet() {
    return [...participants].filter((p) => !this.met.has(p));
  }
  printUnmet() {
    const unmet = this.unmet();
    console.log(`participant ${this.id} unmet:`);
    console.log(
      JSON.stringify(
        unmet.map((unmet) => unmet.toString()),
        null,
        ""
      )
    );
  }
  toString() {
    return this.id;
  }
}

// instantiation
const rooms: Room[] = [];
for (let i = 0; i < numRooms; i++) {
  const r = new Room();
  rooms.push(r);
}

const participantsList: Participant[] = [];
for (const pid of participantIds) {
  const p = new Participant(pid);
  participantsList.push(p);
}
const participants = new Set(participantsList);

// initial assignment
const numPerRoom = Math.ceil(participantIds.length / numRooms);
for (let i = 0; i < numRooms; i++) {
  const r = rooms[i];
  const assignment = new Set(
    participantsList.slice(
      numPerRoom * i,
      Math.min(participantIds.length, numPerRoom * (i + 1))
    )
  );
  r.addAssignment(assignment);
}

// shuffle
console.log("stats:");
for (let attempt = 0; attempt + 1 < shuffles; attempt++) {
  let currentRoom = 0;
  let currentAssignment = new Set<Participant>();
  const prioritizedParticipantsList = participantsList.sort((a, b) => {
    return a.met.size - b.met.size;
  });
  console.log(
    JSON.stringify(
      prioritizedParticipantsList.map((p) => `${p.id}(met:${p.met.size})`)
    )
  );
  for (const p of prioritizedParticipantsList) {
    const unmet = p.unmet();

    // all unmet participants
    const sizeUnmet = unmet.length;
    // number of participants that can fit in the current room (w/o me)
    const sizeRoom = numPerRoom - currentAssignment.size - 1;

    // add myself
    currentAssignment.add(p);

    // add others
    const size = Math.min(sizeUnmet, sizeRoom);
    unmet.slice(0, size).forEach((p_) => currentAssignment.add(p_));

    // check room size
    if (currentAssignment.size >= numPerRoom) {
      rooms[currentRoom++].addAssignment(currentAssignment);
      currentAssignment = new Set<Participant>();
      if (currentRoom >= rooms.length) {
        break;
      }
    }
  }
  if (currentRoom < rooms.length) {
    rooms[currentRoom].addAssignment(currentAssignment);
  }
}
console.log();

// print
for (const r of rooms) {
  r.print();
  console.log();
}
const noUnmet = participantsList.reduce((p, c) => p && (c.met.size === participants.size), true);
if (noUnmet) {
  console.log("every participant can meet all the other participants")
} else {
  participants.forEach(p => p.printUnmet());
}

// ---program output ---
//
// stats:
// ["src1062(met:3)","src1025(met:3)","src1008(met:3)","src1061(met:4)","src1029(met:4)","src1036(met:4)","src1050(met:4)","src1048(met:4)","src1049(met:4)","src1051(met:4)","src1017(met:4)"]
// ["src1050(met:4)","src1048(met:4)","src1049(met:4)","src1051(met:4)","src1017(met:4)","src1062(met:6)","src1025(met:6)","src1008(met:6)","src1061(met:7)","src1029(met:7)","src1036(met:7)"]
// ["src1017(met:4)","src1051(met:5)","src1062(met:6)","src1025(met:6)","src1008(met:6)","src1050(met:7)","src1048(met:8)","src1049(met:8)","src1061(met:9)","src1029(met:9)","src1036(met:9)"]
// ["src1025(met:6)","src1008(met:6)","src1017(met:7)","src1051(met:8)","src1050(met:8)","src1062(met:9)","src1048(met:9)","src1049(met:9)","src1061(met:11)","src1029(met:11)","src1036(met:11)"]
// ["src1051(met:8)","src1008(met:9)","src1025(met:10)","src1017(met:10)","src1062(met:10)","src1050(met:11)","src1048(met:11)","src1049(met:11)","src1061(met:11)","src1029(met:11)","src1036(met:11)"]
// 
// room 1 assignments:
// ["src1061","src1029","src1036","src1050"]
// ["src1062","src1061","src1029","src1036"]
// ["src1050","src1048","src1049","src1051"]
// ["src1017","src1061","src1029","src1036"]
// ["src1025","src1050","src1048","src1049"]
// ["src1051","src1062","src1025","src1008"]
// 
// room 2 assignments:
// ["src1048","src1049","src1051","src1017"]
// ["src1025","src1061","src1029","src1036"]
// ["src1048","src1061","src1029","src1036"]
// ["src1051","src1061","src1029","src1036"]
// ["src1008","src1050","src1048","src1049"]
// ["src1008","src1017","src1025","src1062"]
// 
// room 3 assignments:
// ["src1062","src1025","src1008"]
// ["src1008","src1061","src1029","src1036"]
// ["src1049","src1061","src1029","src1036"]
// ["src1062","src1050","src1048","src1049"]
// ["src1017","src1050","src1062","src1025"]
// ["src1050","src1048","src1049","src1061"]
// 
// every participant can meet all the other participants
