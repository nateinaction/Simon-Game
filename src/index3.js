import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk';
import React, { PropTypes } from 'react';
import { Provider, connect } from 'react-redux'
import { render } from 'react-dom';
import { Navbar, Nav, NavItem, Glyphicon, ProgressBar, Modal, FormGroup, ControlLabel, FormControl, Button, InputGroup } from 'react-bootstrap';
import './index.scss';
import bell from '../public/bell.mp3';

/*
 * Example Object
 */
/*
{
	play: true,
	timer: {
		timeRemaining: 2699,
		visible: 'pomodoro'
	}
	initialLength: {
		pomodoro: 2700,
		break: 300
	},
	settingsModal: false
}
*/

/*
 * Redux Action Creators
 */

const setPlay = (bool) => ({
	type: 'SET_PLAY',
	bool
})

const setVisibleTimer = (timer) => ({
	type: 'SET_VISIBLE_TIMER',
	timer
})

const setPomodoroLength = (time) => ({
	type: 'SET_POMODORO_LENGTH',
	time
})

const setBreakLength = (time) => ({
	type: 'SET_BREAK_LENGTH',
	time
})

const decrementTimeRemaining = () => ({
	type: 'DECREMENT_TIME_REMAINING'
})

const showModal = (bool) => ({
	type: 'SHOW_MODAL',
	bool
})

const reset = (time) => ({
	type: 'RESET',
	time
})

const resetTimer = () => {
	return (dispatch, getState) => {
    const state = getState()
    let visibleTimer = state.timer.visibleTimer
    let pomodoroLength = state.initialLength.pomodoro
    let breakLength = state.initialLength.break

    if (visibleTimer === 'pomodoro') {
    	return dispatch(reset(pomodoroLength))
    } else {
    	return dispatch(reset(breakLength))
    }
	}
}

/*
 * Redux Reducers
 */

const play = (state = false, action) => {
	switch (action.type) {
		case 'SET_PLAY':
			return action.bool
		case 'RESET':
			return false
		default:
			return state
	}
}

const settingsModal = (state = false, action) => {
	switch (action.type) {
		case 'SHOW_MODAL':
			return action.bool
		case 'SAVE_SETTINGS':
			return false
		default:
			return state
	}
}

const timer = (state = {timeRemaining: 2700, visibleTimer: 'pomodoro'}, action) => {
	switch (action.type) {
		case 'SET_POMODORO_LENGTH':
			if (state.visibleTimer === 'pomodoro') {
				return Object.assign({}, state, {
					timeRemaining: action.time
	    	})
			}
			return state
		case 'SET_BREAK_LENGTH':
			if (state.visibleTimer === 'break') {
				return Object.assign({}, state, {
					timeRemaining: action.time
	    	})
			}
			return state
		case 'DECREMENT_TIME_REMAINING':
			return Object.assign({}, state, {
				timeRemaining: state.timeRemaining - 1
    	})
    case 'SET_VISIBLE_TIMER':
    	return Object.assign({}, state, {
				visibleTimer: action.timer
    	})
		case 'RESET':
			return Object.assign({}, state, {
				timeRemaining: action.time
    	})
		default:
			return state
	}
}

const initialLength = (state = {pomodoro: 2700, break: 300}, action) => {
	switch (action.type) {
		case 'SET_POMODORO_LENGTH':
			return Object.assign({}, state, {
				pomodoro: action.time
    	})
    case 'SET_BREAK_LENGTH':
			return Object.assign({}, state, {
				break: action.time
    	})
		default:
			return state
	}
}

const visibleTimer = (state = 'pomodoro', action) => {
	switch (action.type) {
		case 'SET_VISIBLE_TIMER':
			return action.timer
		default:
			return state
	}
}

const pomodoroApp = combineReducers({
	play,
	timer,
	initialLength,
	settingsModal,
	visibleTimer
})

/*
 * Redux Store
 */

let store = createStore(pomodoroApp, applyMiddleware(thunk))

/*
 * Helper Fns
 */


const playBellHelper = (input) => {
	document.getElementById('bell').play()
}

const validateInputHelper = (input) => {
	if (input <= 1) {
		return 1
	} else if (input >= 240) {
		return 240
	}
	return input
}

const timerHelper = () => {
	let interval = null
	store.subscribe(() => {
		if (store.getState().play && store.getState().timer.timeRemaining <= 0 && interval !== null) {
      clearInterval(interval);
      interval = null
      if (store.getState().timer.visibleTimer === 'pomodoro') {
      	store.dispatch(setVisibleTimer('break'))
      } else {
      	store.dispatch(setVisibleTimer('pomodoro'))
      }
      store.dispatch(resetTimer())
      store.dispatch(setPlay(true))
      playBellHelper()
    } else {
    	if (store.getState().play && interval === null) {
	      interval = setInterval(() => {
	        store.dispatch(decrementTimeRemaining())
	      }, 1000)
	    }
	    if (!store.getState().play && interval !== null) {
	      clearInterval(interval);
	      interval = null
	    }
    }
	})
}
timerHelper()

/*
 * Redux state to console log
 */

console.log('initial state')
console.log(store.getState())
store.subscribe(() => console.log(store.getState()))


/*
 * React Components
 */

const Bell = (props) => (
	<audio id='bell' src={bell} preload='auto'>
		<p>Your browser does not support the <code>audio</code> element </p>
	</audio>
)

const Timer = (props) => {
	let minutesRemaining = Math.floor(props.timeRemaining / 60)
	let secondsRemaining = (props.timeRemaining % 60 > 9) ? props.timeRemaining % 60 : "0" + props.timeRemaining % 60
	let timeInitial = (props.visibleTimer === 'pomodoro') ? props.pomodoroLength : props.breakLength
	let message = (props.visibleTimer === 'pomodoro') ? 'Get to work!' : 'Take a break!'
	return (
		<div>
			<ProgressBar now={100 - (props.timeRemaining * 100 / timeInitial)} />
			<div id='timer-container'>
				<h1>{minutesRemaining}:{secondsRemaining}</h1>
				<h3>{message}</h3>
			</div>
		</div>
	)
}
Timer.propTypes = {
	timeRemaining: PropTypes.number.isRequired,
	visibleTimer: PropTypes.string.isRequired,
	pomodoroLength: PropTypes.number.isRequired,
	breakLength: PropTypes.number.isRequired
}

const EditPomodoro = (props) => (
	<FormGroup controlId='Pomodoro Length'>
    <ControlLabel>Pomodoro Length</ControlLabel>
    <InputGroup bsSize='large'>
	    <FormControl
	    	onChange={(e) => {
	    		e.preventDefault()
	    		let validInput = validateInputHelper(e.target.value)
	    		return props.onSetPomodoroLength(validInput * 60)
	    	}}
	    	value={props.pomodoroLength / 60}
	    	type='number'
	    	bsSize='large'
	    	placeholder='Pomodoro Length' />
    	<InputGroup.Addon>minutes</InputGroup.Addon>
    </InputGroup>
  </FormGroup>
)
EditPomodoro.propTypes = {
	onSetPomodoroLength: PropTypes.func.isRequired,
	pomodoroLength: PropTypes.number.isRequired
}

const EditBreak = (props) => (
	<FormGroup controlId='Break Length'>
    <ControlLabel>Break Length</ControlLabel>
    <InputGroup bsSize='large'>
	    <FormControl
	    	onChange={(e) => {
	    		e.preventDefault()
	    		let validInput = validateInputHelper(e.target.value)
	    		return props.onSetBreakLength(validInput * 60)
	    	}}
	    	value={props.breakLength / 60}
	    	type='number'
	    	placeholder='Break Length' />
	    <InputGroup.Addon>minutes</InputGroup.Addon>
    </InputGroup>
  </FormGroup>
)
EditBreak.propTypes = {
	onSetBreakLength: PropTypes.func.isRequired,
	breakLength: PropTypes.number.isRequired
}

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

const SettingsForm = (props) => (
  <form>
    <EditPomodoro
    	pomodoroLength={props.pomodoroLength}
    	onSetPomodoroLength={props.handleSetPomodoroLength} />
    <EditBreak
    	breakLength={props.breakLength}
    	onSetBreakLength={props.handleSetBreakLength} />
    <CloseButton onHideModal={props.handleHideModal} />
  </form>
)
SettingsForm.propTypes = {
	handleSetPomodoroLength: PropTypes.func.isRequired,
	pomodoroLength: PropTypes.number.isRequired,
	handleSetBreakLength: PropTypes.func.isRequired,
	breakLength: PropTypes.number.isRequired,
	handleHideModal: PropTypes.func.isRequired
}

const SettingsModal = (props) => (
  <Modal show={props.settingsModal} onHide={props.handleHideModal}>
    <Modal.Header closeButton>
      <Modal.Title>Pomodoro Settings</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <SettingsForm
	      	pomodoroLength={props.pomodoroLength}
	      	breakLength={props.breakLength}
	      	handleSetPomodoroLength={props.handleSetPomodoroLength}
	      	handleSetBreakLength={props.handleSetBreakLength}
	      	handleHideModal={props.handleHideModal} />
    </Modal.Body>
  </Modal>
)
SettingsModal.propTypes = {
	settingsModal: PropTypes.bool.isRequired,
	handleSetPomodoroLength: PropTypes.func.isRequired,
	pomodoroLength: PropTypes.number.isRequired,
	handleSetBreakLength: PropTypes.func.isRequired,
	breakLength: PropTypes.number.isRequired,
	handleHideModal: PropTypes.func.isRequired
}

const SettingsButton = (props) => (
	<NavItem onClick={props.handleShowModal}><Glyphicon glyph='cog' /> Settings</NavItem>
)
SettingsButton.propTypes = {
	handleShowModal: PropTypes.func.isRequired
}

const ResetButton = (props) => (
	<NavItem onClick={props.handleResetClick}><Glyphicon glyph='repeat' /> Reset</NavItem>
)
ResetButton.propTypes = {
	handleResetClick: PropTypes.func.isRequired
}

const PlayPauseButton = (props) => {
	if (props.play === false) {
		return <NavItem onClick={props.handlePlayClick}><Glyphicon glyph='play' /> Start</NavItem>
	} else {
		return <NavItem onClick={props.handlePauseClick}><Glyphicon glyph='pause' /> Pause</NavItem>
	}
}
PlayPauseButton.propTypes =  {
	play: PropTypes.bool.isRequired,
	handlePlayClick: PropTypes.func.isRequired,
	handlePauseClick: PropTypes.func.isRequired
}

const ControlBar = (props) => (
	<Navbar collapseOnSelect fixedBottom>
    <Navbar.Header>
      <Navbar.Brand>
        Pomodoro Timer
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
    	<Nav>
      	<PlayPauseButton
      		play={props.play}
      		handlePlayClick={props.handlePlayClick}
      		handlePauseClick={props.handlePauseClick} />
      	<ResetButton
      		handleResetClick={props.handleResetClick} />
      	<SettingsButton
      		handleShowModal={props.handleShowModal} />
      </Nav>
    </Navbar.Collapse>
  </Navbar>
)
ControlBar.propTypes =  {
	play: PropTypes.bool.isRequired,
	handlePlayClick: PropTypes.func.isRequired,
	handlePauseClick: PropTypes.func.isRequired,
	handleResetClick: PropTypes.func.isRequired,
	handleShowModal: PropTypes.func.isRequired
}

/*
 * React-Redux Container Components
 */

const mapStateToProps = (state) => ({
	play: state.play
})

const mapDispatchToProps = (dispatch) => ({
	handlePlayClick: () => {
		dispatch(setPlay(true))
	},
	handlePauseClick: () => {
		dispatch(setPlay(false))
	},
	handleShowModal: () => {
		dispatch(showModal(true))
	},
	handleHideModal: () => {
		dispatch(showModal(false))
	},
	handleResetClick: () => {
		dispatch(resetTimer())
	}
})

const ControlBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ControlBar)

const mapStateToPropsTwo = (state) => ({
	timeRemaining: state.timer.timeRemaining,
	visibleTimer: state.timer.visibleTimer,
	pomodoroLength: state.initialLength.pomodoro,
	breakLength: state.initialLength.break
})

const mapDispatchToPropsTwo = (dispatch) => ({

})

const TimerContainer = connect(
	mapStateToPropsTwo,
	mapDispatchToPropsTwo
)(Timer)

const mapStateToPropsThree = (state) => ({
	settingsModal: state.settingsModal,
	pomodoroLength: state.initialLength.pomodoro,
	breakLength: state.initialLength.break
})

const mapDispatchToPropsThree = (dispatch) => ({
	handleHideModal: () => {
		dispatch(showModal(false))
	},
	handleSetPomodoroLength: (time) => {
		dispatch(setPomodoroLength(time))
	},
	handleSetBreakLength: (time) => {
		dispatch(setBreakLength(time))
	}
})

const SettingsModalContainer = connect(
	mapStateToPropsThree,
	mapDispatchToPropsThree
)(SettingsModal)

/*
 * React Root Component
 */

const App = (props) => (
	<div id='App'>
		<TimerContainer />
		<ControlBarContainer />
		<SettingsModalContainer />
		<Bell />
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

