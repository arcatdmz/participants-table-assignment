// input
const numRooms = 3;
const participantData: [string, ParticipantCategories][] = [
  ["src1061", "undergrad"],
  ["src1029", "undergrad"],
  ["src1036", "undergrad"],
  ["src1050", "undergrad"],
  ["src1048", "grad"],
  ["src1049", "undergrad"],
  ["src1051", "grad"],
  ["src1017", "undergrad"],
  ["src1062", "undergrad"],
  ["src1025", "grad"],
  ["src1008", "grad"],
];
const initialAssignments: [string, number][] = [
  ["src1061", 1],
  ["src1029", 1],
  ["src1036", 1],
  ["src1050", 1],
  ["src1048", 2],
  ["src1049", 2],
  ["src1051", 2],
  ["src1017", 3],
  ["src1062", 3],
  ["src1025", 3],
  ["src1008", 3],
];
const shuffles = 4;

// class def
type ParticipantCategories = "undergrad" | "grad";
const cats = ["grad", "undergrad"] as ParticipantCategories[];

class Room {
  public static numRooms: number = 0;
  id: number;
  assignments: Set<Participant>[];
  constructor() {
    this.id = ++Room.numRooms;
    this.assignments = [];
    for (let i = 0; i < shuffles; i++) {
      this.assignments.push(new Set<Participant>());
    }
  }
  updateAssignment(attempt: number) {
    const ps = this.assignments[attempt];
    for (const p of ps) {
      p.assignments[attempt] = this;
      for (const p_ of ps) {
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
  id: string;
  category: ParticipantCategories;
  assignments: Room[];
  met: Set<Participant>;
  constructor(data: [string, ParticipantCategories]) {
    this.assignments = [];
    for (let i = 0; i < shuffles; i++) {
      this.assignments[i] = null;
    }
    this.id = data[0];
    this.category = data[1];
    this.met = new Set([this]);
  }
  metInCategory() {
    return [...participants].filter(
      (p) => p.category === this.category && this.met.has(p)
    );
  }
  unmet() {
    return [...participants].filter((p) => !this.met.has(p));
  }
  unmetInCategory() {
    return [...participants].filter(
      (p) => p.category === this.category && !this.met.has(p)
    );
  }
  printUnmet() {
    const unmet = this.unmet();
    Participant.printParticipants(unmet, `participant ${this.id} unmet:`);
  }
  printUnmetInCategory() {
    const unmet = this.unmetInCategory();
    Participant.printParticipants(
      unmet,
      `participant ${this.id} unmet in category:`
    );
  }
  printAssignments() {
    console.log(
      `participant ${this.id} assigned to: ${JSON.stringify(
        this.assignments.map((r) => String(r?.id || "-"))
      )}`
    );
  }
  toString() {
    return this.id;
  }
  static printParticipants(participants: Participant[], title?: string) {
    if (title) {
      console.log(title);
    }
    console.log(
      JSON.stringify(
        participants.map((unmet) => unmet.toString()),
        null,
        ""
      )
    );
  }
}

// instantiation
const rooms: Room[] = [];
for (let i = 0; i < numRooms; i++) {
  const r = new Room();
  rooms.push(r);
}

const participantsList: Participant[] = [];
for (const pData of participantData) {
  const p = new Participant(pData);
  participantsList.push(p);
}
const participants = new Set(participantsList);

// initial assignment
const numPerRoom = Math.ceil(participantData.length / numRooms);
// for (let i = 0; i < numRooms; i++) {
//   const r = rooms[i];
//   participantsList
//     .slice(
//       numPerRoom * i,
//       Math.min(participantData.length, numPerRoom * (i + 1))
//     )
//     .forEach((p) => r.assignments[0].add(p));
//   r.updateAssignment(0);
// }
for (const [pid, currentRoomPlusOne] of initialAssignments) {
  let currentAssignment = rooms[currentRoomPlusOne - 1].assignments[0];
  currentAssignment.add(participantsList.find((p) => p.id === pid));
}
rooms.forEach((room) => room.updateAssignment(0));

// shuffle
console.log("stats:");
for (let attempt = 1; attempt < shuffles; attempt++) {
  // sort category according to the number of the current unsatisfied conditions
  const sortedCats = (cats.map((cat) => [
    cat,
    participantsList
      .filter((p) => p.category === cat)
      .reduce((p, c, _, arr) => p + c.unmetInCategory().length / arr.length, 0),
  ]) as [ParticipantCategories, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  for (const cat of sortedCats) {
    const prioritizedParticipantsList = participantsList
      .filter((p) => p.category === cat)
      .sort((a, b) => {
        return a.metInCategory().length - b.metInCategory().length;
      });
    console.log(
      cat,
      JSON.stringify(
        prioritizedParticipantsList.map(
          (p) => `${p.id}(met:${p.metInCategory().length})`
        )
      )
    );

    let currentRoom = cat === "grad" ? 0 : numRooms - 1;
    let currentAssignment = rooms[currentRoom].assignments[attempt];
    for (const p of prioritizedParticipantsList) {
      // skip already assigned participant
      if (p.assignments[attempt]) {
        continue;
      }

      // all unmet participants (+ me = 1)
      const unmet = p
        .unmetInCategory()
        .filter((p_) => !p_.assignments[attempt]);
      const sizeUnmet = unmet.length + 1;

      // number of participants that can fit in the current room
      const sizeRoom = numPerRoom - currentAssignment.size;

      const size = Math.min(sizeUnmet, sizeRoom);
      if (size > 0) {
        // add myself
        currentAssignment.add(p);

        // add others
        unmet.slice(0, size - 1).forEach((p_) => currentAssignment.add(p_));

        // update "met" list
        rooms[currentRoom].updateAssignment(attempt);

        // check room size and move to the next room
        if (currentAssignment.size >= numPerRoom) {
          if (cat === "grad") {
            currentRoom++;
          } else {
            currentRoom--;
          }
          if (currentRoom >= rooms.length || currentRoom < 0) {
            break;
          }
          currentAssignment = rooms[currentRoom].assignments[attempt];
        }
      }
    }
  }
}
console.log();

// print
for (const r of rooms) {
  r.print();
  console.log();
}
const noUnmet = participantsList.reduce(
  (p, c) => p && c.unmetInCategory().length <= 0,
  true
);
if (noUnmet) {
  console.log(
    "every participant can meet all the other participants in the same category"
  );
  participants.forEach((p) => p.printAssignments());
} else {
  participants.forEach((p) => p.printUnmetInCategory());
}

// ---program output ---
//
// stats:
// undergrad ["src1049(met:1)","src1017(met:2)","src1062(met:2)","src1061(met:4)","src1029(met:4)","src1036(met:4)","src1050(met:4)"]
// grad ["src1048(met:2)","src1051(met:2)","src1025(met:2)","src1008(met:2)"]
// undergrad ["src1017(met:3)","src1062(met:3)","src1049(met:4)","src1061(met:5)","src1029(met:5)","src1036(met:5)","src1050(met:6)"]
// grad ["src1048(met:4)","src1051(met:4)","src1025(met:4)","src1008(met:4)"]
// undergrad ["src1062(met:4)","src1061(met:6)","src1029(met:6)","src1036(met:6)","src1049(met:6)","src1017(met:6)","src1050(met:7)"]
// grad ["src1048(met:4)","src1051(met:4)","src1025(met:4)","src1008(met:4)"]
//
// room 1 assignments:
// ["src1061","src1029","src1036","src1050"]
// ["src1048","src1025","src1008","src1051"]
// ["src1048","src1051","src1025","src1008"]
// ["src1048","src1051","src1025","src1008"]
//
// room 2 assignments:
// ["src1048","src1049","src1051"]
// ["src1017","src1050","src1062"]
// ["src1062","src1049","src1050"]
// ["src1049","src1017","src1050"]
//
// room 3 assignments:
// ["src1017","src1062","src1025","src1008"]
// ["src1049","src1061","src1029","src1036"]
// ["src1017","src1061","src1029","src1036"]
// ["src1062","src1061","src1029","src1036"]
//
// every participant can meet all the other participants in the same category
// participant src1061 assigned to: ["1","3","3","3"]
// participant src1029 assigned to: ["1","3","3","3"]
// participant src1036 assigned to: ["1","3","3","3"]
// participant src1050 assigned to: ["1","2","2","2"]
// participant src1048 assigned to: ["2","1","1","1"]
// participant src1049 assigned to: ["2","3","2","2"]
// participant src1051 assigned to: ["2","1","1","1"]
// participant src1017 assigned to: ["3","2","3","2"]
// participant src1062 assigned to: ["3","2","2","3"]
// participant src1025 assigned to: ["3","1","1","1"]
// participant src1008 assigned to: ["3","1","1","1"]
