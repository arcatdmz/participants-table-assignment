import debug from "debug";
const log = debug("participants-table-assignment");

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
const shuffles = 3;

// class def
type ParticipantCategories = "undergrad" | "grad";
const cats = ["grad", "undergrad"] as ParticipantCategories[];

class Room {
  assignments: Set<Participant>[];
  constructor(public id: number) {
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
}

function drawAssignment() {
  // instantiation
  const rooms: Room[] = [];
  for (let i = 0; i < numRooms; i++) {
    const r = new Room(i);
    rooms.push(r);
  }

  const participantsList: Participant[] = [];
  for (const pData of participantData) {
    const p = new Participant(pData);
    participantsList.push(p);
  }
  const participants = new Set(participantsList);
  const numPerRoom = Math.ceil(participantData.length / numRooms);

  // initial assignment
  for (const [pid, currentRoomPlusOne] of initialAssignments) {
    const currentAssignment = rooms[currentRoomPlusOne - 1].assignments[0];
    currentAssignment.add(participantsList.find((p) => p.id === pid));
  }
  rooms.forEach((room) => room.updateAssignment(0));

  // random assignments
  for (let attempt = 1; attempt < shuffles; attempt++) {
    const rs = [...rooms];
    for (const p of participants) {
      const ri = Math.floor(Math.random() * rs.length);
      const r = rs[ri];
      r.assignments[attempt].add(p);
      if (r.assignments[attempt].size >= numPerRoom) {
        rs.splice(ri, 1);
      }
    }
    rooms.forEach((room) => room.updateAssignment(attempt));
  }
  return { rooms, participants: participantsList };
}

function evaluateAssignment({ participants }: { participants: Participant[] }) {
  return cats.reduce((prev, cat) => {
    const participantsInCategory = participants.filter(
      (participant) => participant.category === cat
    );
    return prev + countUnmetsScore(participantsInCategory);
  }, 0);
}

function countUnmetsScore(participants: Participant[]) {
  return participants.reduce(
    (p, c) =>
      p + participants.filter((p_) => p_ !== c && !p_.met.has(c)).length,
    0
  );
}

const attempts = 10000000;
let score = Math.pow(participantData.length, 2);
let assignment: { rooms: Room[]; participants: Participant[] };
for (let i = 0; i < attempts; i++) {
  const currentAssignment = drawAssignment();
  const currentScore = evaluateAssignment({
    participants: currentAssignment.participants,
  });
  if (currentScore < score) {
    assignment = currentAssignment;
    score = currentScore;
  }
  if (i % 1000000 === 0) {
    log("current score: %d", score);
  }
}

log(`final score: ${score}`);

for (const r of assignment.rooms) {
  console.log(`room ${r.id + 1} assignments:`);
  r.assignments.forEach((a) =>
    console.log(
      JSON.stringify(
        [...a].map((p) => p.id),
        null,
        ""
      )
    )
  );
  console.log();
}

for (const p of assignment.participants) {
  console.log(
    `participant ${p.id} assigned to: ${JSON.stringify(
      p.assignments.map((r) => String(r.id + 1))
    )} with unmets: ${JSON.stringify(
      [...participantData]
        .filter(
          ([pid, cat]) =>
            p.category === cat && ![...p.met].find((p_) => p_.id === pid)
        )
        .map(([pid]) => pid)
    )}`
  );
}

// ---program output ---
//
// room 1 assignments:
// ["src1061","src1029","src1036","src1050"]
// ["src1051","src1025","src1008"]
// ["src1061","src1029","src1049","src1062"]
//
// room 2 assignments:
// ["src1048","src1049","src1051"]
// ["src1061","src1029","src1048","src1017"]
// ["src1036","src1050","src1051","src1017"]
//
// room 3 assignments:
// ["src1017","src1062","src1025","src1008"]
// ["src1036","src1050","src1049","src1062"]
// ["src1048","src1025","src1008"]
//
// participant src1061 assigned to: ["1","2","1"] with unmets: []
// participant src1029 assigned to: ["1","2","1"] with unmets: []
// participant src1036 assigned to: ["1","3","2"] with unmets: []
// participant src1050 assigned to: ["1","3","2"] with unmets: []
// participant src1048 assigned to: ["2","2","3"] with unmets: []
// participant src1049 assigned to: ["2","3","1"] with unmets: ["src1017"]
// participant src1051 assigned to: ["2","1","2"] with unmets: []
// participant src1017 assigned to: ["3","2","2"] with unmets: ["src1049"]
// participant src1062 assigned to: ["3","3","1"] with unmets: []
// participant src1025 assigned to: ["3","1","3"] with unmets: []
// participant src1008 assigned to: ["3","1","3"] with unmets: []
