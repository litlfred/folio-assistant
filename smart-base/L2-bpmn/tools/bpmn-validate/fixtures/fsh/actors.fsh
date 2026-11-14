// Two ActorDefinitions, one with its keyword lines in another order, and an
// Instance that is not an ActorDefinition although its id looks like a lane's.
Instance: DAK.Persona.HealthWorker
InstanceOf: ActorDefinition
Usage: #definition
* name = "HealthWorker"
* title = "Health worker"

Instance: DAK.Persona.Client
Usage: #definition
InstanceOf: ActorDefinition
* name = "Client"

Instance: Lane_Guessed
InstanceOf: Questionnaire
* status = #draft
