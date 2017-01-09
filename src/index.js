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
	active: {id: 4, timestamp: 100000},
	timestamp: 100001
}
*/

/*
 * Helper Fns
 */

// loadAudioHelper fixes issue on mobile safari which loads only on click
const loadAudioHelper = () => {
	sounds.forEach((url, index) => {
		document.getElementById('sound-' + index).load()
	})
}

const playSoundHelper = (number) => {
	document.getElementById('sound-' + number).currentTime = 0.1
	document.getElementById('sound-' + number).play()
}

const newSequenceHelper = () => {
	return Array(20).fill(null).map(() => (
		Math.floor(Math.random() * 4)
	))
}

const arrIsSameHelper = (arrA, arrB) => {
	let truthyArray = arrA.map((item, index) => {
		return (arrB[index] === item)
	})
	return (truthyArray.indexOf(false) === -1) ? true : false
}

const chooseIntervalHelper = (level) => {
	if (level > 12) {
		return 400
	}
	if (level > 8) {
		return 600
	}
	if (level > 4) {
		return 800
	}
	return 1000
}

/*
 * Redux Action Creators
 */

const clearAll = () => ({
	type: 'CLEAR_ALL',
	sequence: newSequenceHelper()
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

const nextLevel = () => ({
	type: 'NEXT_LEVEL'
})

const activateButton = (id, interval) => ({
	type: 'ACTIVATE_BUTTON',
	time: Date.now() + interval,
	id
})

const deactivateButton = () => ({
	type: 'DEACTIVATE_BUTTON'
})

const deactivateButtonControl = () => (
	(dispatch, getState) => {
		setTimeout(() => {
			let { active } = getState()
			if (active.timestamp <= Date.now()) {
				return dispatch(deactivateButton())
			}
		}, 300)
	}
)

const activeButtonControl = (id) => (
	dispatch => {
		let interval = 300
		playSoundHelper(id)
		dispatch(activateButton(id, interval))
		return dispatch(deactivateButtonControl())
	}
)

const playSequence = (count = 0) => (
	(dispatch, getState) => {
		let { turn, sequence, level } = getState()
		if (turn === 'computer') {
			let interval = chooseIntervalHelper(level)
			setTimeout(() => {
				if (count < level) {
					let id = sequence[count]
					let nextCount = count + 1
					if (nextCount >= level) {
						dispatch(activeButtonControl(id))
						return dispatch(setTurn('player'))
					} else {
						dispatch(playSequence(nextCount))
						return dispatch(activeButtonControl(id))
					}
				}
			}, interval);
		}
	}
)

const setTurnToComputer = () => (
	dispatch => {
		dispatch(setTurn('computer'))
		return dispatch(playSequence())
	}
)

const setUserLoss = (strict) => (
	dispatch => {
		if (strict) {
			return dispatch(setTurn('loss'))
		} else {
			return dispatch(setTurnToComputer())
		}
	}
)

const setWinOrNextLevel = (sequence, level) => (
	dispatch => {
		let maxLevel = (level >= 20)
		if (!maxLevel) {
			dispatch(nextLevel())
			return dispatch(playSequence())
		} else {
			return dispatch(setTurn('win'))
		}
	}
)

const validateInput = (id, sequence, level, player, strict) => (
	dispatch => {
		let test = [...player, id]
		let match = arrIsSameHelper(test, sequence)
		if (!match) {
			return dispatch(setUserLoss(strict))
		} else if (test.length === level) {
			return dispatch(setWinOrNextLevel(sequence, level))
		}
		return dispatch(addToPlayer(id))
	}
)

const buttonClick = (id) => (
	(dispatch, getState) => {
    let { turn, sequence, level, player, strict } = getState()
		if (turn === 'player') {
			dispatch((activeButtonControl(id)))
			return dispatch((validateInput(id, sequence, level, player, strict)))
		}
  	return dispatch((activeButtonControl(id)))
	}
)

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

const sequence = (state = newSequenceHelper(), action) => {
	switch (action.type) {
		case 'CLEAR_ALL':
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
		case 'NEXT_LEVEL':
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
const activeDefault = {id: null, timestamp: null}
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
				timestamp: action.time
			})
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
	active
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
store.subscribe(() => console.log(store.getState()))

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
	if (props.turn === 'loss') {
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
		dispatch(setTurnToComputer())
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
