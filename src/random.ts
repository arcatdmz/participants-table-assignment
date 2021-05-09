import debug from "debug";
const log = debug("participants-table-assignment");

// class def
type ParticipantCategories = "undergrad" | "grad";
const cats = ["grad", "undergrad"] as ParticipantCategories[];

class Room {
  assignments: Set<Participant>[];
  constructor(public id: number, shuffles: number) {
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
  constructor(data: [string, ParticipantCategories], shuffles: number) {
    this.assignments = [];
    for (let i = 0; i < shuffles; i++) {
      this.assignments[i] = null;
    }
    this.id = data[0];
    this.category = data[1];
    this.met = new Set([this]);
  }
}

function search({
  numRooms,
  numShuffles,
  participantData,
  ignoredPairs,
  initialAssignments,
}: {
  numRooms: number;
  numShuffles: number;
  participantData: [string, ParticipantCategories][];
  ignoredPairs?: [string, string][];
  initialAssignments?: [string, number][];
}) {
  function drawAssignment() {
    // instantiation
    const rooms: Room[] = [];
    for (let i = 0; i < numRooms; i++) {
      const r = new Room(i, numShuffles);
      rooms.push(r);
    }

    const participantsList: Participant[] = [];
    for (const pData of participantData) {
      const p = new Participant(pData, numShuffles);
      participantsList.push(p);
    }
    const participants = new Set(participantsList);
    const numPerRoom = Math.ceil(participantData.length / numRooms);

    // initial assignment
    if (initialAssignments) {
      for (const [pid, currentRoomPlusOne] of initialAssignments) {
        const currentAssignment = rooms[currentRoomPlusOne - 1].assignments[0];
        currentAssignment.add(participantsList.find((p) => p.id === pid));
      }
      rooms.forEach((room) => room.updateAssignment(0));
    }

    // random assignments
    for (
      let attempt = initialAssignments ? 1 : 0;
      attempt < numShuffles;
      attempt++
    ) {
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

  function evaluateAssignment({
    participants,
  }: {
    participants: Participant[];
  }) {
    return cats.reduce((prev, cat) => {
      const participantsInCategory = participants.filter(
        (participant) => participant.category === cat
      );
      return prev + countUnmetsScore(participantsInCategory);
    }, 0);
  }

  function countUnmetsScore(participants: Participant[]) {
    return participants.reduce(
      (p, c) => p + countUnmetsScoreForParticipant(participants, c),
      0
    );
  }

  function countUnmetsScoreForParticipant(
    participants: Participant[],
    participant: Participant
  ) {
    return participants.filter(
      (p) =>
        p !== participant &&
        !p.met.has(participant) &&
        (!ignoredPairs ||
          !ignoredPairs.find(
            ([a, b]) =>
              (p.id === a && participant.id === b) ||
              (p.id === b && participant.id === a)
          ))
    ).length;
  }

  const attempts = 1000000;
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
    if (score <= 0) {
      break;
    }
    if (i % 100000 === 0) {
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
}

// D
search({
  numRooms: 3,
  numShuffles: 3,
  participantData: [
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
  ],
  ignoredPairs: [["src1017", "src1062"]],
  initialAssignments: [
    ["src1061", 1],
    ["src1029", 1],
    ["src1036", 1],
    ["src1050", 1],
    ["src1048", 2],
    ["src1049", 2],
    ["src1051", 2],
    ["src1017", 3],
    ["src1062", 2],
    ["src1025", 3],
    ["src1008", 3],
  ],
});

// E
search({
  numRooms: 2,
  numShuffles: 3,
  participantData: [
    ["src1047", "grad"],
    ["src1017", "undergrad"],
    ["src1062", "undergrad"],
    ["src1051", "grad"],
    ["src1016", "grad"],
    ["src1023", "grad"],
    ["src1044", "grad"],
  ],
  initialAssignments: [
    ["src1047", 1],
    ["src1017", 1],
    ["src1062", 1],
    ["src1051", 2],
    ["src1016", 2],
    ["src1023", 2],
    ["src1044", 2],
  ],
});

// F
search({
  numRooms: 3,
  numShuffles: 3,
  participantData: [
    ["src1061", "undergrad"],
    ["src1029", "undergrad"],
    ["src1036", "undergrad"],
    ["src1050", "undergrad"],
    ["src1016", "grad"],
    ["src1048", "grad"],
    ["src1023", "grad"],
    ["src1044", "grad"],
    ["src1047", "grad"],
    ["src1049", "undergrad"],
    ["src1025", "grad"],
    ["src1008", "grad"],
  ],
  initialAssignments: [
    ["src1061", 1],
    ["src1029", 1],
    ["src1036", 1],
    ["src1050", 1],
    ["src1016", 2],
    ["src1048", 2],
    ["src1023", 2],
    ["src1044", 2],
    ["src1047", 3],
    ["src1049", 3],
    ["src1025", 3],
    ["src1008", 3],
  ],
});

// ---program output ---
//
// room 1 assignments:
// ["src1061","src1029","src1036","src1050"]
// ["src1051","src1025","src1008"]
// ["src1029","src1050","src1051","src1062"]
//
// room 2 assignments:
// ["src1048","src1049","src1051","src1062"]
// ["src1061","src1036","src1048","src1062"]
// ["src1061","src1036","src1049","src1017"]
//
// room 3 assignments:
// ["src1017","src1025","src1008"]
// ["src1029","src1050","src1049","src1017"]
// ["src1048","src1025","src1008"]
//
// participant src1061 assigned to: ["1","2","2"] with unmets: []
// participant src1029 assigned to: ["1","3","1"] with unmets: []
// participant src1036 assigned to: ["1","2","2"] with unmets: []
// participant src1050 assigned to: ["1","3","1"] with unmets: []
// participant src1048 assigned to: ["2","2","3"] with unmets: []
// participant src1049 assigned to: ["2","3","2"] with unmets: []
// participant src1051 assigned to: ["2","1","1"] with unmets: []
// participant src1017 assigned to: ["3","3","2"] with unmets: ["src1062"]
// participant src1062 assigned to: ["2","2","1"] with unmets: ["src1017"]
// participant src1025 assigned to: ["3","1","3"] with unmets: []
// participant src1008 assigned to: ["3","1","3"] with unmets: []
//
// room 1 assignments:
// ["src1047","src1017","src1062"]
// ["src1017","src1062","src1051"]
// ["src1016","src1023","src1044"]
//
// room 2 assignments:
// ["src1051","src1016","src1023","src1044"]
// ["src1047","src1016","src1023","src1044"]
// ["src1047","src1017","src1062","src1051"]
//
// participant src1047 assigned to: ["1","2","2"] with unmets: []
// participant src1017 assigned to: ["1","1","2"] with unmets: []
// participant src1062 assigned to: ["1","1","2"] with unmets: []
// participant src1051 assigned to: ["2","1","2"] with unmets: []
// participant src1016 assigned to: ["2","2","1"] with unmets: []
// participant src1023 assigned to: ["2","2","1"] with unmets: []
// participant src1044 assigned to: ["2","2","1"] with unmets: []
//
// room 1 assignments:
// ["src1061","src1029","src1036","src1050"]
// ["src1016","src1044","src1025","src1008"]
// ["src1050","src1016","src1044","src1047"]
//
// room 2 assignments:
// ["src1016","src1048","src1023","src1044"]
// ["src1061","src1048","src1023","src1047"]
// ["src1061","src1029","src1036","src1049"]
//
// room 3 assignments:
// ["src1047","src1049","src1025","src1008"]
// ["src1029","src1036","src1050","src1049"]
// ["src1048","src1023","src1025","src1008"]
//
// participant src1061 assigned to: ["1","2","2"] with unmets: []
// participant src1029 assigned to: ["1","3","2"] with unmets: []
// participant src1036 assigned to: ["1","3","2"] with unmets: []
// participant src1050 assigned to: ["1","3","1"] with unmets: []
// participant src1016 assigned to: ["2","1","1"] with unmets: []
// participant src1048 assigned to: ["2","2","3"] with unmets: []
// participant src1023 assigned to: ["2","2","3"] with unmets: []
// participant src1044 assigned to: ["2","1","1"] with unmets: []
// participant src1047 assigned to: ["3","2","1"] with unmets: []
// participant src1049 assigned to: ["3","3","2"] with unmets: []
// participant src1025 assigned to: ["3","1","3"] with unmets: []
// participant src1008 assigned to: ["3","1","3"] with unmets: []
