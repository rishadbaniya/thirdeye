import {gql} from "@apollo/client";
import axios from "axios";
import buildGraphQLProvider from 'ra-data-graphql-simple';
import {addRefreshAuthToDataProvider} from "react-admin";
import {refreshAuth} from "./authProvider";
const GRAPHQL_URI = "http://localhost:8080/graphql";


const myBuildQuery = (fetchType, resource, params) => {
    console.log(`${fetchType} for ${resource}`);
    if (fetchType === "CREATE") {
        const data = params.data;

        switch (resource) {
            case "Routine":
                const batch = params.data.batch;
                const faculty = params.data.faculty;
                const isDraft = params.data.isDraft;

                let schedule = {
                    ...data.schedule,
                };
                delete schedule.__typename;
                for (let key in schedule) {
                    console.log(key);
                    if (Array.isArray(schedule[key])) {
                        schedule[key] = schedule[key].map((d) => {
                            delete d.__typename;
                            return d;
                        });
                    }
                }
                console.log(schedule);
                const create_routine = gql`
                fragment DayScheduleFields on SubjectSchedule {
                  subject
                  startTime
                  endTime
                }
                mutation createRoutine($batch :Int!, $faculty :Faculty!, $schedule : InputDaySchedule!, $isDraft : Boolean!) {
                  routine {
                    createRoutine(routine: {
                      batch : $batch,
                      faculty : $faculty,
                      schedule : $schedule,
                      isDraft : $isDraft
                    }){
                       id
                       isDraft
                       batch
                       faculty
                       schedule{
                           sun { ...DayScheduleFields }
                           mon { ...DayScheduleFields }
                           tue { ...DayScheduleFields }
                           wed { ...DayScheduleFields }
                           thu { ...DayScheduleFields }
                           fri { ...DayScheduleFields }
                       }
                    }
                  }
                }`;
                return {
                    query: create_routine,
                    variables: {
                        batch,
                        faculty,
                        schedule,
                        isDraft
                    },
                    parseResponse: response => {
                        return {
                            data: {
                                ...response.data.routine.createRoutine
                            },
                        };
                    },
                };
            case "User":
                const create_user = gql`
                   mutation createUser(
                        $fullName: String!,
                        $primaryEmail: String!,
                        $password: String!,
                        $phoneNumber: String!,
                        $userRole: UserRole!,
                        $secondaryEmail: String,
                        $gender: Gender,
                        $batch: Int,
                        $imageUrl: String,
                        $userType: UserType,
                        $faculty: Faculty
                      ) {
                        user {
                          createUser(newUser: {
                            fullName: $fullName,
                            primaryEmail: $primaryEmail,
                            password: $password,
                            phoneNumber: $phoneNumber,
                            userRole: $userRole,
                            secondaryEmail: $secondaryEmail,
                            gender: $gender,
                            batch: $batch,
                            imageUrl: $imageUrl,
                            userType: $userType,
                            faculty: $faculty,
                          })
                        }
                      }
                `;

                return {
                    query: create_user,
                    variables: {
                        fullName: data.fullName,
                        primaryEmail: data.primaryEmail,
                        password: data.password,
                        phoneNumber: data.phoneNumber,
                        userRole: data.userRole,
                        secondaryEmail: data.secondaryEmail,
                        gender: data.gender,
                        batch: data.batch,
                        imageUrl: data.imageUrl,
                        userType: data.userType,
                        faculty: data.faculty,
                    },
                    parseResponse: response => {
                        console.log(response);
                        return {
                            data: {
                                id: response.data.user.createUser,
                            },
                        };
                    },
                };
            case "Event":
                const create_event = gql`
                   mutation createEvent(
                        $date: Int!,
                        $title: String!,
                        $location: String!,
                        $categories: [String!]!,
                        $description: String!,
                        $isDraft: Boolean!,
                      ) {
                        event {
                          createEvent(inputEvent: {
                            date: $date,
                            title: $title,
                            location: $location,
                            categories: $categories,
                            description: $description,
                            isDraft: $isDraft,
                          }){
                            id
                            date
                            title
                            location
                            categories
                            noOfRegistrants
                            registrants
                            description
                            isDraft
                          }
                        }
                      }`;
                return {
                    query: create_event,
                    variables: {
                        title: data.title,
                        location: data.location,
                        categories: data.categories,
                        description: data.description,
                        date: data.date,
                        isDraft: data.isDraft
                    },
                    parseResponse: response => {
                        return {
                            data: {
                                ...response.data.event.createEvent
                            },
                        };
                    },
                };
        }
    }
    else if (fetchType === 'GET_LIST') {
        let page = params.pagination.page;
        let perPage = params.pagination.perPage;
        let filter = params.filter;
        switch (resource) {
            case "Routine":
                const get_list_routine = gql`
                   query all${resource}s {
                      routine {
                         all${resource}s(page : ${page}, perPage : ${perPage}) {
                            id
                            isDraft
                            batch
                            faculty
                         }
                      }
                   }
                `;
                return {
                    query: get_list_routine,
                    variables: {}, // You can add variables if needed
                    parseResponse: response => {
                        return {
                            data: response.data.routine.allRoutines,
                            total: response.data.routine.allRoutines.length,
                        };
                    },
                };
            case "Event":
                const get_list_event = gql`
                    query allEvents($page : Int, $perPage : Int, $filter : FilterEvent){
                        event{
                            allEvents(page : $page, perPage : $perPage, filter : $filter){
                              count
                              data {
                                 id
                                 date
                                 title
                                 location
                                 categories
                                 noOfRegistrants
                                 description
                                 isDraft
                                }
                            }   
                        } 
                   }
              `;
                return {
                    query: get_list_event,
                    variables: {}, // You can add variables if needed
                    parseResponse: response => {
                        console.log(response);
                        return {
                            data: response.data.event.allEvents.data,
                            total: response.data.event.allEvents.count,
                        };
                    },
                };
            case "User":
                const get_list_user = gql`
                query allUsers($page : Int, $perPage : Int, $filter : FilterUser){
                        user{
                            allUsers(page : $page, perPage : $perPage, filter : $filter) {
                                count
                                data {
                                    id
                                    fullName
                                    primaryEmail
                                    userRole
                                    gender
                                    batch
                                    faculty
                                    userType
                                }
                            }
                        }
                   }
              `;
                return {
                    query: get_list_user,
                    variables: {page, perPage, filter}, // You can add variables if needed
                    parseResponse: response => {
                        console.log(response);
                        return {
                            data: response.data.user.allUsers.data,
                            total: response.data.user.allUsers.count,
                        };
                    },
                };
        }
    } else if (fetchType === "GET_ONE") {
        switch (resource) {
            case "Routine":
                const get_one_routine = gql`
                    fragment DayScheduleFields on SubjectSchedule {
                      subject
                      startTime
                      endTime
                    }

                   query getRoutine {
                      routine {
                        Routine(id : "${params.id}") {
                            id
                            isDraft
                            batch
                            faculty
                            schedule{
                                sun { ...DayScheduleFields }
                                mon { ...DayScheduleFields }
                                tue { ...DayScheduleFields }
                                wed { ...DayScheduleFields }
                                thu { ...DayScheduleFields }
                                fri { ...DayScheduleFields }
                            }
                         }
                      }
                   }
                `;
                return {
                    query: get_one_routine,
                    variables: {}, // You can add variables if needed
                    parseResponse: response => {
                        return {
                            data: response.data.routine.Routine,
                        };
                    },
                };
            case "User":
                const get_one_user = gql`
                  query getUser($id: String, $primaryEmail : String) {
                     user {
                       User(
                          primaryEmail : $primaryEmail,
                          id : $id,
                         ){
                            id
                            fullName
                            primaryEmail
                            secondaryEmail
                            gender 
                            phoneNumber
                            registeredEvents
                            certificates
                            batch
                            imageUrl
                            userRole
                            faculty
                            userType

                        }
                     }
                  }
               `;
                return {
                    query: get_one_user,
                    variables: {
                        id: params.id,
                    },
                    parseResponse: response => {
                        return {
                            data: response.data.user.User,
                        };
                    },
                };
            case "Event":
                const get_one_event = gql`
                  query getEvent($id: String!) {
                     event{
                       Event(
                          id : $id,
                         ){
                            id
                            date
                            title
                            location
                            categories
                            noOfRegistrants
                            registrants
                            description
                        }
                     }
                  }
               `;
                return {
                    query: get_one_event,
                    variables: {
                        id: params.id,
                    },
                    parseResponse: response => {
                        return {
                            data: response.data.event.Event,
                        };
                    },
                };
        }
    } else if (fetchType === 'UPDATE') {
        let data = params.data;
        switch (resource) {
            case "Routine":
                let schedule = {
                    ...data.schedule,
                };
                delete schedule.__typename;
                for (let key in schedule) {
                    console.log(key);
                    if (Array.isArray(schedule[key])) {
                        schedule[key] = schedule[key].map((d) => {
                            delete d.__typename;
                            return d;
                        });
                    }
                }

                const update_routine = gql`
                     fragment DayScheduleFields on SubjectSchedule {
                       subject
                       startTime
                       endTime
                     }
                     mutation updateRoutine(
                            $id : String!,
                            $batch :Int!,
                            $faculty :Faculty!,
                            $schedule : InputDaySchedule!,
                            $isDraft : Boolean!) {
                            routine {
                              updateRoutine(id: $id, updatedRoutine: {
                                batch : $batch,
                                isDraft : $isDraft,
                                faculty : $faculty,
                                schedule : $schedule
                              }){
                                 id
                                 batch
                                 isDraft
                                 faculty
                                 schedule{
                                     sun { ...DayScheduleFields }
                                     mon { ...DayScheduleFields }
                                     tue { ...DayScheduleFields }
                                     wed { ...DayScheduleFields }
                                     thu { ...DayScheduleFields }
                                     fri { ...DayScheduleFields }
                                 }
                              }
                            }
                     }`;

                return {
                    query: update_routine,
                    variables: {
                        id: params.data.id,
                        batch: params.data.batch,
                        faculty: params.data.faculty,
                        isDraft: params.data.isDraft,
                        schedule: schedule
                    }, // You can add variables if needed
                    parseResponse: response => {
                        console.log(response);
                        return {
                            data: {
                                ...response.data.routine.updateRoutine
                            },
                        };
                    },
                };
            case "User":
                console.log(params);
                const update_user = gql`
                        mutation updateUser(
                             $id : String!,
                             $fullName: String,
                             $primaryEmail: String!,
                             $password: String,
                             $secondaryEmail: String,
                             $gender: Gender,
                             $phoneNumber: String,
                             $registeredEvents : [String!]
                             $certificates : [String!]
                             $batch: Int,
                             $imageUrl: String,
                             $userRole: UserRole,
                             $faculty: Faculty
                             $userType: UserType,
                           ) {
                             user {
                               updateUser(
                               id : $id
                               updatedUser: {
                                 fullName: $fullName,
                                 primaryEmail: $primaryEmail,
                                 password: $password,
                                 secondaryEmail: $secondaryEmail,
                                 gender: $gender,
                                 phoneNumber: $phoneNumber,
                                 registeredEvents : $registeredEvents,
                                 certificates : $certificates,
                                 batch: $batch,
                                 imageUrl: $imageUrl,
                                 userRole: $userRole,
                                 faculty: $faculty,
                                 userType: $userType,
                               })
                             }
                           }
                     `;

                return {
                    query: update_user,
                    variables: {
                        id: params.id,
                        fullName: data.fullName,
                        primaryEmail: data.primaryEmail,
                        password: data.password,
                        secondaryEmail: data.secondaryEmail,
                        gender: data.gender,
                        phoneNumber: data.phoneNumber,
                        registeredEvents: data.registeredEvents,
                        certificates: data.certificates,
                        batch: data.batch,
                        imageUrl: data.imageUrl,
                        userRole: data.userRole,
                        faculty: data.faculty,
                        userType: data.userType,
                    },
                    parseResponse: response => {
                        console.log(data);
                        console.log(response);
                        return {
                            data
                        };
                    },
                };
            case "Event":
                const update_event = gql`
                        mutation updateEvent(
                            $id : String!,
                            $date: Int!,
                            $title: String!,
                            $location: String!,
                            $categories: [String!]!,
                            $description: String!,
                            $isDraft: Boolean!,
                           ){
                             event {
                               updateEvent(
                               id : $id
                               updatedEvent: {
                                    date : $date,
                                    title : $title,
                                    location : $location,
                                    description : $description,
                                    categories : $categories
                                    isDraft : $isDraft,
                               }){
                                    id
                                    date
                                    title
                                    location
                                    categories
                                    noOfRegistrants
                                    description
                                    isDraft
                                }
                             }
                           }
                     `;

                return {
                    query: update_event,
                    variables: {
                        id: params.id,
                        title: data.title,
                        location: data.location,
                        categories: data.categories,
                        description: data.description,
                        date: data.date,
                        isDraft: data.isDraft
                    },
                    parseResponse: response => {
                        console.log(data);
                        console.log(response);
                        return {
                            data: {
                                ...response.data.event.updateEvent
                            }
                        };
                    },
                };
        }

    } else if (fetchType === 'DELETE') {
        let id = params.id;
        const delete_mutation = gql`
         mutation delete${resource}($id: String!) {
                ${resource.toLowerCase()}{
                    delete${resource}(id: $id)
                }
            }
        `;
        return {
            query: delete_mutation,
            variables: {
                id
            },
            parseResponse: response => {
                if (response.data[resource.toLowerCase()][`delete${resource}`] > 0) {
                    return {data: {id: params.id}};
                }
                throw new Error(`Could not delete ${resource}`);
            },
        };
    }
    return null; // Return null for unsupported fetch types
};


const graphqlProvider = (access_token) => {
    return buildGraphQLProvider({
        introspection: false,
        clientOptions: {
            uri: GRAPHQL_URI,
            headers: {
                "Authorization": access_token
            }
        },
        buildQuery: (_) => myBuildQuery
    });
}


const refreshGraphqlProvider = (access_token) => {
    return addRefreshAuthToDataProvider(graphqlProvider(access_token), refreshAuth);
};

export default refreshGraphqlProvider;
