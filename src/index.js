import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk';
import React, { PropTypes } from 'react'
import { Provider, connect } from 'react-redux'
import { render } from 'react-dom';
import { Grid, Row, Col, Navbar, Nav, NavItem, Glyphicon, Modal, Button } from 'react-bootstrap'
import './index.scss'

import blueSound from '../public/simonSound1.mp3'
import yellowSound from '../public/simonSound2.mp3'
import redSound from '../public/simonSound3.mp3'
import greenSound from '../public/simonSound4.mp3'
const sounds = [blueSound, yellowSound, redSound, greenSound]

/*
 * Example Object
 */
/*
{
	turn: 'computer', // 'player', 'playing'
	level: 1,
	sequence: [0,0,3,1,2],
	player: [0,0...],
	strict: true,
	active: {id: 4, played: false, timestamp: 100000},
	timestamp: 100001
}
*/

/*
 * Redux Action Creators
 */

const clearAll = () => ({
	type: 'CLEAR_ALL'
})
/*
const clearPlayer = () => ({
	type: 'CLEAR_PLAYER'
})
*/
const setSequence = (sequence) => ({
	type: 'SET_SEQUENCE',
	sequence
})

const addToPlayer = (item) => ({
	type: 'ADD_TO_PLAYER',
	item
})

const setTurn = (turn) => ({
	type: 'SET_TURN',
	turn
})

const toggleStrict = () => ({
	type: 'TOGGLE_STRICT'
})

const activateButton = (id) => ({
	type: 'ACTIVATE_BUTTON',
	time: Date.now(),
	id
})

const deactivateButton = () => ({
	type: 'DEACTIVATE_BUTTON'
})

const buttonClick = (id) => (
	(dispatch, getState) => {
    let {turn} = getState()

		if (turn === 'player') {
			dispatch((addToPlayer(id)))
		}
  	dispatch((activateButton(id)))
	}
)

const updateTimestamp = () => ({
	type: 'SET_TIMESTAMP',
	time: Date.now()
})

const soundPlayed = () => ({
	type: 'SOUND_PLAYED'
})

const nextLevel = () => ({
	type: 'NEXT_LEVEL'
})

/*
 * Redux Reducers
 */

const turn = (state = null, action) => {
	switch (action.type) {
		case 'CLEAR_ALL':
 			return null
		case 'SET_TURN':
 			return action.turn
		case 'NEXT_LEVEL':
 			return 'computer'
		default:
			return state
	}
}

const level = (state = 1, action) => {
 	switch (action.type) {
 		case 'CLEAR_ALL':
		case 'CLEAR_PLAYER':
 			return 1
 		case 'NEXT_LEVEL':
 			return state + 1
 		default:
 			return state
 	}
 }

const sequence = (state = [], action) => {
	switch (action.type) {
		case 'CLEAR_ALL':
			return []
		case 'SET_SEQUENCE':
			return action.sequence
		default:
			return state
	}
}

const player = (state = [], action) => {
	switch (action.type) {
		case 'CLEAR_ALL':
		case 'CLEAR_PLAYER':
		case 'SET_TURN':
			return []
		case 'ADD_TO_PLAYER':
			return [...state, action.item]
		default:
			return state
	}
}

const strict = (state = false, action) => {
	switch (action.type) {
		case 'TOGGLE_STRICT':
			return !state
		default:
			return state
	}
}

// complexity level 7. Could refactor but I think it's straight forward bc it's a redux reducer
const activeDefault = {id: null, played: false, timestamp: null}
const active = (state = activeDefault, action) => {
	switch (action.type) {
		case 'CLEAR_ALL':
		case 'CLEAR_PLAYER':
		case 'TOGGLE_TURN':
		case 'DEACTIVATE_BUTTON':
			return activeDefault
		case 'ACTIVATE_BUTTON':
			return Object.assign({}, state, {
				id: action.id,
				played: false,
				timestamp: action.time
			})
		case 'SOUND_PLAYED':
			return Object.assign({}, state, {
				played: true
			})
		default:
			return state
	}
}

const timestamp = (state = Date.now(), action) => {
	switch (action.type) {
		case 'SET_TIMESTAMP':
			return action.time
		default:
			return state
	}
}

const simonApp = combineReducers({
	turn,
	level,
	sequence,
	player,
	strict,
	active,
	timestamp
})

/*
 * Redux Store
 */

let store = createStore(simonApp, applyMiddleware(thunk))

/*
 * Redux state to console log
 */

console.log('initial state')
console.log(store.getState())
let prevState = null
store.subscribe(() => { // log statement removes timestamp tick
	let state = Object.assign({}, store.getState(), {
		timestamp: null
	})

	if (prevState === null) {
		prevState = state
	} else {
		Object.keys(prevState).forEach((key) => {
			if (prevState[key] !== state[key]) {
				console.log(state)
				prevState = state
			}
		})
	}
})

/*
 * Helper Fns
 */

const loadAudioHelper = () => { // fixes issue on mobile safari which loads only on click
	sounds.forEach((url, index) => {
		document.getElementById('sound-' + index).load()
	})
}

const playSoundHelper = (number) => {
	document.getElementById('sound-' + number).currentTime = 0.1
	document.getElementById('sound-' + number).play()
}

const chooseInterval = (level) => {
	switch (level) {
		case level > 12:
			return 500
		case level > 8:
			return 600
		case level > 4:
			return 800
		default:
			return 1000
	}
}

let count = 0
let playerTime = null
const playSequence = (sequence, level, timestamp) => {
	let interval = chooseInterval(level)
	if (playerTime + interval < timestamp && count < level) {
		let id = sequence[count]
		playerTime = Date.now()
		count += 1
		return store.dispatch(activateButton(id))
	} else if (count >= level) {
		count = 0
		return store.dispatch(setTurn('player'))
	}
}

const sequencePlayer = (turn, sequence, level, timestamp) => {
	if (turn === 'computer') {
		playerTime = Date.now()
		return store.dispatch(setTurn('playing sequence'))
	} else if (turn === 'playing sequence') {
		return playSequence(sequence, level, timestamp)
	}
}

const buttonController = (active, timestamp) => {
	if (active.id !== null) {
		if (!active.played) {
			playSoundHelper(active.id)
			return store.dispatch(soundPlayed())
		}
		if (active.timestamp + 300 < timestamp) {
			return store.dispatch(deactivateButton())
		}
	}
}

const newSequenceHelper = () => {
	return Array(20).fill(null).map(() => (
		Math.floor(Math.random() * 4)
	))
}

const dispatchNewSequence = (sequence) => {
	if (sequence.length < 1) {
		let newSequence = newSequenceHelper()
		return store.dispatch(setSequence(newSequence))
	}
}

const arrIsSame = (arrA, arrB) => {
	let truthyArray = arrA.map((item, index) => {
		return (arrB[index] === item)
	})
	return (truthyArray.indexOf(false) === -1) ? true : false
}

const theJudge = (turn, sequence, level, player) => {
	if (turn === 'player') {
		if (player.length > 0) {
			let match = arrIsSame(player, sequence)
			if (!match) {
				return store.dispatch(setTurn('fail'))
			} else if (player.length === level) {
				let maxLevel = (level >= 20)
				if (!maxLevel) {
					return store.dispatch(nextLevel())
				} else {
					return store.dispatch(setTurn('win'))
				}
			}
		}
	}
}

const failCheck = (turn, strict) => {
	if (turn === 'fail') {
		if (strict) {
			store.dispatch(setTurn('failModal'))
		} else {
			store.dispatch(setTurn('computer'))
		}
	}
}

const gameControllerSubscribe = () => {
	store.subscribe(() => {
		let {turn, level, sequence, player, strict, active, timestamp} = store.getState()

		sequencePlayer(turn, sequence, level, timestamp)
		buttonController(active, timestamp)
		theJudge(turn, sequence, level, player)
		failCheck(turn, strict)

		// if sequence is cleared, dispatch new sequence
		dispatchNewSequence(sequence)
	})
}

const initializeSimon = () => {
	let sequence = store.getState()
	dispatchNewSequence(sequence)
}

const gameTick = () => {
	// least ugly solution?
	setInterval(() => {
		return store.dispatch(updateTimestamp())
	}, 100)
}
gameTick()
initializeSimon()
gameControllerSubscribe()

/*
 * React Presentational Components
 */

 const AudioComponents = () => (
	<div className='audio-components'>
		{sounds.map((thisSound, index) => (
			<audio key={index} id={'sound-' + index} src={sounds[index]} preload='auto'>
				<p>Your browser does not support the <code>audio</code> element.</p>
			</audio>
		))}
	</div>
)

const CloseButton = (props) => (
	<Button
  	bsStyle="primary"
  	block={true}
  	onClick={() => {
  		return props.onHideModal()
  	}}>
    Close
  </Button>
)
CloseButton.propTypes = {
	onHideModal: PropTypes.func.isRequired
}

const StatusModal = (props) => {
	let showModal = false
	let title = 'Ooops!'
	let message = 'Looks like you missed one. Want to try again?'
	if (props.turn === 'failModal') {
		showModal = true
	}
	if (props.turn === 'win') {
		title = 'Congratulations!'
		message = 'Wow! Who knew you had such a great memory? Want to try again?'
		showModal = true
	}
	return (
	  <Modal show={showModal} onHide={props.handleHideModal}>
	    <Modal.Header closeButton>
	      <Modal.Title>{title}</Modal.Title>
	    </Modal.Header>
	    <Modal.Body>
	      {message}
	    </Modal.Body>
			<Modal.Footer>
				<CloseButton onHideModal={props.handleHideModal} />
			</Modal.Footer>
	  </Modal>
	)
}
StatusModal.propTypes = {
	turn: PropTypes.string,
	handleHideModal: PropTypes.func.isRequired
}

const GameButton = (props) => {
	let classes = 'game-button-' + props.id
	classes = (props.activeId === props.id) ? classes + ' active-button' : classes
	return <div className={classes} onClick={() => props.handleButtonClick(props.id)} />
}
GameButton.propTypes =  {
	id: PropTypes.number.isRequired,
	activeId: PropTypes.number,
	handleButtonClick: PropTypes.func.isRequired
}

const GameLayout = (props) => {
	let buttonIds = [0, 1, 2, 3]
	return (
		<Grid>
			<Row>
				{buttonIds.map((index) => (
					<Col key={index} xs={6}>
						<GameButton
							id={index}
							activeId={props.active.id}
							handleButtonClick={props.handleButtonClick} />
					</Col>
				))}
			</Row>
		</Grid>
	)
}
GameLayout.propTypes =  {
	active: PropTypes.object.isRequired,
	handleButtonClick: PropTypes.func.isRequired
}

const LevelCounter = (props) => (
	<Navbar.Text><strong>Level</strong> {props.level}</Navbar.Text>
)
LevelCounter.propTypes = {
	level: PropTypes.number.isRequired
}

const StrictButton = (props) => {
	if (props.strict === false) {
		return <NavItem onClick={props.handleStrictClick}><Glyphicon glyph='education' /> Difficulty: Normal</NavItem>
	} else {
		return <NavItem onClick={props.handleStrictClick} active><Glyphicon glyph='education' /> Difficulty: Hard</NavItem>
	}
}
StrictButton.propTypes =  {
	strict: PropTypes.bool.isRequired,
	handleStrictClick: PropTypes.func.isRequired
}

const PlayResetButton = (props) => {
	if (props.turn === null) {
		return <NavItem onClick={props.handlePlayClick}><Glyphicon glyph='play' /> Play</NavItem>
	} else {
		return <NavItem onClick={props.handleResetClick}><Glyphicon glyph='repeat' /> Restart</NavItem>
	}
}
PlayResetButton.propTypes =  {
	turn: PropTypes.string,
	handlePlayClick: PropTypes.func.isRequired,
	handleResetClick: PropTypes.func.isRequired
}

const ControlBar = (props) => (
	<Navbar inverse collapseOnSelect fixedBottom>
    <Navbar.Header>
      <Navbar.Brand>
        Simon Game
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
			<LevelCounter
				level={props.level} />
    	<Nav>
      	<PlayResetButton
      		turn={props.turn}
      		handlePlayClick={props.handlePlayClick}
      		handleResetClick={props.handleResetClick} />
      	<StrictButton
					strict={props.strict}
      		handleStrictClick={props.handleStrictClick} />
      </Nav>
    </Navbar.Collapse>
  </Navbar>
)
ControlBar.propTypes =  {
	turn: PropTypes.string,
	level: PropTypes.number.isRequired,
	strict: PropTypes.bool.isRequired,
	handlePlayClick: PropTypes.func.isRequired,
	handleStrictClick: PropTypes.func.isRequired,
	handleResetClick: PropTypes.func.isRequired
}

/*
 * React-Redux Container Components
 */

const mapStateToProps = (state) => ({
	turn: state.turn,
	level: state.level,
	strict: state.strict
})

const mapDispatchToProps = (dispatch) => ({
	handlePlayClick: () => {
		loadAudioHelper()
		dispatch(setTurn('computer'))
	},
	handleStrictClick: () => {
		dispatch(toggleStrict())
	},
	handleResetClick: () => {
		dispatch(clearAll())
	}
})

const ControlBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ControlBar)

const mapStateToPropsTwo = (state) => ({
	active: state.active
})

const mapDispatchToPropsTwo = (dispatch) => ({
	handleButtonClick: (id) => {
		dispatch(buttonClick(id))
	}
})

const GameLayoutContainer = connect(
	mapStateToPropsTwo,
	mapDispatchToPropsTwo
)(GameLayout)

const mapStateToPropsThree = (state) => ({
	turn: state.turn
})

const mapDispatchToPropsThree = (dispatch) => ({
	handleHideModal: () => {
		dispatch(clearAll())
	}
})

const StatusModalContainer = connect(
	mapStateToPropsThree,
	mapDispatchToPropsThree
)(StatusModal)

const App = (props) => (
	<div className="App">
		<GameLayoutContainer />
		<ControlBarContainer />
		<StatusModalContainer />
	  <AudioComponents />
  </div>
)

/*
 * React Dom
 */

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
